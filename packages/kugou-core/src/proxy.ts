// @music-api/kugou-core — proxy.ts
// KUGOU_API_PROXY 的代理请求实现。
//
// 背景：global fetch 不支持代理配置，且本包不允许新增依赖
//（undici 在 Node 24 下不可 import），故在配置代理时代理解析为 CONNECT 隧道手工实现。
// 无代理时 request.ts 仍走 global fetch，本文件完全不参与。
// 偏差声明：隧道实现为尽力移植，未经真实代理联调；行为以"能连通"为目标，
// 细节（分块/长连接复用）与 axios 原实现不逐字节对齐。

import { connect as netConnect, type Socket } from "node:net";
import { connect as tlsConnect } from "node:tls";
import type { ProxyConfig } from "./runtime.js";

export interface ProxyRequestInit {
	method: string;
	headers: Record<string, string>;
	body?: Buffer;
}

function tcpConnect(host: string, port: number): Promise<Socket> {
	return new Promise((resolve, reject) => {
		const sock = netConnect(port, host);
		sock.once("connect", () => resolve(sock));
		sock.once("error", reject);
	});
}

function tlsWrap(sock: Socket, servername: string): Promise<Socket> {
	return new Promise((resolve, reject) => {
		const tlsSock = tlsConnect({ socket: sock, servername });
		tlsSock.once("secureConnect", () => resolve(tlsSock));
		tlsSock.once("error", reject);
	});
}

function writeAll(sock: Socket, data: Buffer): Promise<void> {
	return new Promise((resolve, reject) => {
		sock.write(data, (err) => (err ? reject(err) : resolve()));
	});
}

/** 带缓冲的 socket 读取器 */
class SocketReader {
	private buf = Buffer.alloc(0);
	private done = false;
	private error: Error | null = null;
	private waiters: Array<() => void> = [];

	constructor(sock: Socket) {
		sock.on("data", (chunk: Buffer) => {
			this.buf = Buffer.concat([this.buf, chunk]);
			this.wake();
		});
		const fin = (): void => {
			this.done = true;
			this.wake();
		};
		sock.on("end", fin);
		sock.on("close", fin);
		sock.on("error", (e: Error) => {
			this.error = e;
			this.done = true;
			this.wake();
		});
	}

	private wake(): void {
		const ws = this.waiters;
		this.waiters = [];
		for (const w of ws) w();
	}

	private async waitData(): Promise<void> {
		if (this.buf.length > 0 || this.done) return;
		await new Promise<void>((resolve) => this.waiters.push(resolve));
	}

	/** 读取到（含）\r\n\r\n，返回头文本与头之后已到达的字节 */
	async readHead(): Promise<{ head: string; rest: Buffer }> {
		for (;;) {
			const idx = this.buf.indexOf("\r\n\r\n");
			if (idx >= 0) {
				const head = this.buf.subarray(0, idx).toString("latin1");
				const rest = this.buf.subarray(idx + 4);
				this.buf = Buffer.alloc(0);
				return { head, rest };
			}
			if (this.done)
				throw (
					this.error ?? new Error("proxy: connection closed while reading head")
				);
			await this.waitData();
		}
	}

	/** 精确读取 n 字节（initial 为已到达的前缀） */
	async readExactly(n: number, initial: Buffer): Promise<Buffer> {
		const parts: Buffer[] = [];
		let have = 0;
		if (initial.length > 0) {
			parts.push(initial);
			have = initial.length;
		}
		while (have < n) {
			if (this.buf.length > 0) {
				const take = Math.min(this.buf.length, n - have);
				parts.push(this.buf.subarray(0, take));
				this.buf = this.buf.subarray(take);
				have += take;
			} else {
				if (this.done)
					throw this.error ?? new Error("proxy: connection closed mid-body");
				await this.waitData();
			}
		}
		return Buffer.concat(parts);
	}

	/** 读取直到连接结束（连接异常则抛错，不返回截断数据） */
	async readAll(initial: Buffer): Promise<Buffer> {
		const parts: Buffer[] = [initial];
		for (;;) {
			if (this.buf.length > 0) {
				parts.push(this.buf);
				this.buf = Buffer.alloc(0);
			}
			if (this.done) break;
			await this.waitData();
		}
		if (this.error) throw this.error;
		return Buffer.concat(parts);
	}
}

function parseHead(head: string): {
	status: number;
	headers: Array<[string, string]>;
} {
	const lines = head.split("\r\n");
	const m = /^HTTP\/\d(?:\.\d)?\s+(\d{3})/.exec(lines[0] ?? "");
	const status = m ? Number(m[1]) : 0;
	const headers: Array<[string, string]> = [];
	for (let i = 1; i < lines.length; i += 1) {
		const ci = lines[i].indexOf(":");
		if (ci > 0)
			headers.push([
				lines[i].slice(0, ci).trim(),
				lines[i].slice(ci + 1).trim(),
			]);
	}
	return { status, headers };
}

/** HTTP/1.1 chunked 解码 */
function dechunk(raw: Buffer): Buffer {
	const parts: Buffer[] = [];
	let off = 0;
	for (;;) {
		const eol = raw.indexOf("\r\n", off);
		if (eol < 0) break;
		const size = Number.parseInt(
			raw.subarray(off, eol).toString("latin1").split(";")[0].trim(),
			16,
		);
		if (!Number.isFinite(size) || size <= 0) break;
		const start = eol + 2;
		parts.push(raw.subarray(start, start + size));
		off = start + size + 2;
	}
	return Buffer.concat(parts);
}

/**
 * 经代理发送 HTTP 请求，返回标准 Response（调用方可与 fetch 结果统一处理）。
 * 流程：TCP 连代理 →（代理为 https 则先 TLS）→ CONNECT 建隧道 →
 * （目标为 https 则隧道上再套 TLS）→ 发送原始 HTTP/1.1 请求 → 解析响应。
 */
export async function fetchViaProxy(
	urlStr: string,
	init: ProxyRequestInit,
	proxy: ProxyConfig,
): Promise<Response> {
	const target = new URL(urlStr);
	const targetPort = target.port
		? Number(target.port)
		: target.protocol === "https:"
			? 443
			: 80;

	let sock = await tcpConnect(proxy.host, proxy.port);
	try {
		if (proxy.protocol === "https") {
			sock = await tlsWrap(sock, proxy.host);
		}

		let reader = new SocketReader(sock);
		let connectReq =
			`CONNECT ${target.hostname}:${targetPort} HTTP/1.1\r\n` +
			`Host: ${target.hostname}:${targetPort}\r\n`;
		if (proxy.auth) {
			const creds = Buffer.from(
				`${proxy.auth.username}:${proxy.auth.password}`,
			).toString("base64");
			connectReq += `Proxy-Authorization: Basic ${creds}\r\n`;
		}
		connectReq += "\r\n";
		await writeAll(sock, Buffer.from(connectReq, "latin1"));
		const connectRes = await reader.readHead();
		const { status: connectStatus } = parseHead(connectRes.head);
		if (connectStatus < 200 || connectStatus >= 300) {
			throw new Error(`proxy CONNECT failed with status ${connectStatus}`);
		}

		// CONNECT 响应后多收的字节：https 目标推回 socket 供 TLS 握手先读；
		// http 目标直接作为响应流前缀。
		if (target.protocol === "https:") {
			if (connectRes.rest.length > 0) sock.unshift(connectRes.rest);
			sock = await tlsWrap(sock, target.hostname);
			reader = new SocketReader(sock);
		}

		const path = `${target.pathname}${target.search}`;
		const outHeaders: Record<string, string> = { ...init.headers };
		outHeaders.Host = target.host;
		if (init.body && init.body.length > 0)
			outHeaders["Content-Length"] = String(init.body.length);
		outHeaders.Connection = "close";
		let reqText = `${init.method.toUpperCase()} ${path} HTTP/1.1\r\n`;
		for (const [k, v] of Object.entries(outHeaders))
			reqText += `${k}: ${v}\r\n`;
		reqText += "\r\n";
		const headBuf = Buffer.from(reqText, "latin1");
		await writeAll(
			sock,
			init.body && init.body.length > 0
				? Buffer.concat([headBuf, init.body])
				: headBuf,
		);

		// https 目标：CONNECT 余字节已推回 socket 并由新 reader 读取；http 目标：余字节是响应流前缀。
		const prefix =
			target.protocol === "https:" ? Buffer.alloc(0) : connectRes.rest;
		const { head: respHead, rest } = await reader.readHead();
		const { status, headers } = parseHead(respHead);
		if (status < 100 || status > 599)
			throw new Error(`proxy: invalid response status ${status}`);

		const lower = new Map<string, string>();
		for (const [k, v] of headers) {
			const lk = k.toLowerCase();
			if (!lower.has(lk)) lower.set(lk, v);
		}
		const bodyStart = Buffer.concat([prefix, rest]);
		let body: Buffer;
		if (
			(lower.get("transfer-encoding") ?? "").toLowerCase().includes("chunked")
		) {
			body = dechunk(await reader.readAll(bodyStart));
		} else if (/^\d+$/.test((lower.get("content-length") ?? "").trim())) {
			body = await reader.readExactly(
				Number((lower.get("content-length") ?? "").trim()),
				bodyStart,
			);
		} else {
			body = await reader.readAll(bodyStart);
		}

		const outH = new Headers();
		for (const [k, v] of headers) {
			try {
				outH.append(k, v);
			} catch {
				// 非法头名跳过（不影响主体）
			}
		}
		// Response 构造器的 BodyInit 同样不接受 Buffer<ArrayBufferLike>，运行时无差异，断言绕过。
		return new Response(body as unknown as BodyInit, { status, headers: outH });
	} finally {
		sock.destroy();
	}
}
