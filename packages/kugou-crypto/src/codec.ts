// @music-api/kugou-crypto — codec.ts
// 手写移植自 KuGouMusicApi/util/util.js（310 行）。
//  - decodeLyrics：跳 4 字节头 + 16 字节 XOR 密钥 + zlib inflate（node:zlib 替代 pako）
//  - calculateMid：MD5 hex 视为大整数转十进制（原生 BigInt 替代 big-integer）
//  - randomString/randomNumber：字符池 + Math.ceil 索引（含边界语义）照搬
//  - generateWebGLHash：Node 分支（随机 uint64）；浏览器分支保留但以 globalThis 守卫

import { inflateSync } from "node:zlib";
import { cryptoMd5 } from "./crypto.js";

/** 生成随机字符串（大写字母 + 数字，36 字符池） */
export const randomString = (len = 16): string => {
	const keyString = "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	const chars = keyString.split("");
	const out: string[] = [];
	for (let i = 0; i < len; i += 1) {
		const ceil = Math.ceil((chars.length - 1) * Math.random());
		out.push(chars[ceil]);
	}
	return out.join("");
};

/** 生成随机数字字符串 */
export const randomNumber = (len = 16): string => {
	const keyString = "1234567890";
	const chars = keyString.split("");
	const out: string[] = [];
	for (let i = 0; i < len; i += 1) {
		const ceil = Math.ceil((chars.length - 1) * Math.random());
		out.push(chars[ceil]);
	}
	return out.join("");
};

/**
 * 格式化 Cookie 字符串：移除 Domain/path/expires/HttpOnly 等非数据字段
 */
export const parseCookieString = (cookie: string): string => {
	const t = cookie.replace(/\s*(Domain|domain|path|expires)=[^(;|$)]+;*/g, "");
	return t.replace(/;HttpOnly/g, "");
};

/**
 * Cookie 字符串转对象。注意：不 trim，按 `;` 分割、按首个 `=` 分割（值含 `=` 会被截断）。
 */
export const cookieToJson = (cookie: string): Record<string, string> => {
	if (!cookie) return {};
	const obj: Record<string, string> = {};
	cookie.split(";").forEach((i) => {
		const arr = i.split("=");
		obj[arr[0]] = arr[1];
	});
	return obj;
};

const KRC_XOR_KEY = [
	64, 71, 97, 119, 94, 50, 116, 71, 81, 54, 49, 45, 206, 210, 110, 105,
];

/**
 * KRC 歌词解码：base64 -> 跳过 4 字节头 -> XOR 解密 -> zlib 解压。
 * 解码失败返回空字符串（原行为）。
 */
export const decodeLyrics = (val: string | Uint8Array | Buffer): string => {
	let bytes: Uint8Array | null = null;
	if (val instanceof Uint8Array) bytes = val;
	if (Buffer.isBuffer(val)) bytes = new Uint8Array(val);
	if (typeof val === "string")
		bytes = new Uint8Array(Buffer.from(val, "base64"));
	if (bytes === null) return "";

	const krcBytes = Buffer.from(bytes.subarray(4));
	for (let i = 0; i < krcBytes.length; i += 1) {
		krcBytes[i] = krcBytes[i] ^ KRC_XOR_KEY[i % KRC_XOR_KEY.length];
	}

	try {
		return inflateSync(krcBytes).toString("utf8");
	} catch {
		return "";
	}
};

/**
 * 计算设备 MID：MD5 hex 视为 16 进制大整数，转十进制字符串。
 * 原实现逐位累加 digit * 16^position，与 BigInt('0x' + hex) 等价。
 */
export const calculateMid = (str: string): string => {
	return BigInt(`0x${cryptoMd5(str)}`).toString(10);
};

/** 生成 UUID v4 格式 GUID */
export const getGuid = (): string => {
	const e = () => {
		return ((65536 * (1 + Math.random())) | 0).toString(16).substring(1);
	};
	return `${e()}${e()}-${e()}-${e()}-${e()}-${e()}${e()}${e()}`;
};

/**
 * WebGL 指纹哈希。Node 环境（无 document）返回随机 uint64 十进制字符串。
 */
export const generateWebGLHash = (): string => {
	const g = globalThis as unknown as { document?: unknown };
	if (typeof g.document !== "undefined") {
		try {
			const doc = g.document as Document;
			const c = doc.createElement("canvas");
			c.width = 200;
			c.height = 50;
			const gl = (c.getContext("webgl") ||
				c.getContext("experimental-webgl")) as unknown as {
				createShader(t: number): unknown;
				shaderSource(s: unknown, src: string): void;
				compileShader(s: unknown): void;
				createProgram(): unknown;
				attachShader(p: unknown, s: unknown): void;
				linkProgram(p: unknown): void;
				useProgram(p: unknown): void;
				createBuffer(): unknown;
				bindBuffer(t: number, b: unknown): void;
				bufferData(t: number, d: Float32Array, u: number): void;
				getAttribLocation(p: unknown, n: string): number;
				enableVertexAttribArray(i: number): void;
				vertexAttribPointer(
					i: number,
					s: number,
					t: number,
					n: boolean,
					st: number,
					o: number,
				): void;
				viewport(x: number, y: number, w: number, h: number): void;
				clearColor(r: number, g: number, b: number, a: number): void;
				clear(m: number): void;
				drawArrays(m: number, f: number, c: number): void;
				readPixels(
					x: number,
					y: number,
					w: number,
					h: number,
					f: number,
					t: number,
					p: Uint8Array,
				): void;
				getExtension(n: string): {
					UNMASKED_VENDOR_WEBGL: string;
					UNMASKED_RENDERER_WEBGL: string;
				} | null;
				getParameter(p: unknown): string;
				VERTEX_SHADER: number;
				FRAGMENT_SHADER: number;
				ARRAY_BUFFER: number;
				STATIC_DRAW: number;
				FLOAT: number;
				COLOR_BUFFER_BIT: number;
				TRIANGLES: number;
				RGBA: number;
				UNSIGNED_BYTE: number;
				VERSION: unknown;
			} | null;
			if (gl) {
				const vs = gl.createShader(gl.VERTEX_SHADER);
				gl.shaderSource(
					vs,
					"attribute vec4 position;void main(){gl_Position=position;}",
				);
				gl.compileShader(vs);
				const fs = gl.createShader(gl.FRAGMENT_SHADER);
				gl.shaderSource(fs, "void main(){gl_FragColor=vec4(1.0,1.0,1.0,1.0);}");
				gl.compileShader(fs);
				const prog = gl.createProgram();
				gl.attachShader(prog, vs);
				gl.attachShader(prog, fs);
				gl.linkProgram(prog);
				gl.useProgram(prog);
				const buf = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, buf);
				gl.bufferData(
					gl.ARRAY_BUFFER,
					new Float32Array([0, 0, 1, 0, 0, 1]),
					gl.STATIC_DRAW,
				);
				const pos = gl.getAttribLocation(prog, "position");
				gl.enableVertexAttribArray(pos);
				gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
				gl.viewport(0, 0, 200, 50);
				gl.clearColor(0, 0, 0, 1);
				gl.clear(gl.COLOR_BUFFER_BIT);
				gl.drawArrays(gl.TRIANGLES, 0, 3);
				const pixels = new Uint8Array(200 * 50 * 4);
				gl.readPixels(0, 0, 200, 50, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
				const dbg = gl.getExtension("WEBGL_debug_renderer_info");
				const vendor = dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : "";
				const renderer = dbg
					? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)
					: "";
				const version = gl.getParameter(gl.VERSION);
				let h = BigInt("14695981039346656037");
				const prime = BigInt("1099511628211");
				for (let i = 0; i < pixels.length; i++) {
					h = ((h ^ BigInt(pixels[i])) * prime) & BigInt("0xFFFFFFFFFFFFFFFF");
				}
				const meta = `${vendor}|${renderer}|${version}`;
				for (let i = 0; i < meta.length; i++) {
					h =
						((h ^ BigInt(meta.charCodeAt(i))) * prime) &
						BigInt("0xFFFFFFFFFFFFFFFF");
				}
				return h.toString();
			}
		} catch {
			// fall through to Node branch
		}
	}
	const hi = Math.floor(Math.random() * 0xffffffff);
	const lo = Math.floor(Math.random() * 0xffffffff);
	return (BigInt(hi) * BigInt(0x100000000) + BigInt(lo)).toString();
};

/** 是否为 UUID v4 */
export const isUUIDv4 = (str: string): boolean => {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
		str,
	);
};
