// @music-api/kugou-core — simulate.ts
// 手写移植自 KuGouMusicApi/util/generate_simulate.js（351 行）。
// 用途：响应头出现 ssa-code 时，生成模拟行为指纹（edt/sid）供客户端走二次验证。
// - randomString / generateWebGLHash 复用 @music-api/kugou-crypto（不重复实现）
// - AES-128-CBC（key 明文 16 字符 + 固定 IV "kugousecurity123"，Base64 输出）
//   与 RSA-OAEP-SHA256（硬编码 SSA 公钥，Base64 输出）走 node:crypto，
//   与原 CryptoJS + node-forge 实现逐字节等价（OAEP 自带随机，无 golden，用形状测试）。
// 偏差声明：原实现有一行 console.log(sidPlaintext) 调试输出（含设备标识），
// 出于隐私考虑未移植（不影响任何 API 行为）。

import { constants, createCipheriv, publicEncrypt } from "node:crypto";
import {
	cryptoMd5,
	generateWebGLHash,
	randomString,
} from "@music-api/kugou-crypto";

/**
 * SSA 行为验证公钥（RSA-2048，OAEP-SHA256）。
 * 从酷狗 WASM 二进制中提取的 SPKI 公钥，与原 generate_simulate.js 内嵌值一致。
 */
const SSA_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAoW2+Ylo8ALePSQTP0xBF
lFmEOHvBD9tS+s7DBlfKEu3RzzvZTaX1JtYbX4+AVUqj6ARz8IM+CKByqGFvbHN/
W64XxNI+q7z36ajCL3VTJ2W5G9MCJitc6oGbire4NQfhaEq0nC+hxBWQvCbIFflA
2ItrLUbSU7z1bHA/a+jlQm4OWvY+IKnTryOJTPuT1yNOVjbJ8wBLKy2DgQr9pPqW
PmEQtGpR5IM9V8Kao6PaSdKYOWGbX3i2+RzIKhvZUxxtJwdVbqPlDPlW9h4/xIBc
56Lgvr4aIl8nFtwbj4UJVUTFuGrs0tY9H/tXvZ22dUCKuGxW/gW7ZF+gXz6vHtYa
rQIDAQAB
-----END PUBLIC KEY-----`;

/** AES 固定 IV（ASCII "kugousecurity123"，与浏览器 WASM 硬编码一致） */
const SSA_AES_IV = "kugousecurity123";

/** 哨兵值：每次调用重新生成（0xFFFFFFFF - [0,20) 随机） */
let SENTINEL = 0xffffffff - Math.floor(Math.random() * 20);

const f3 = (t: number, i: number, x: number, y: number): string =>
	`3,${t},${i},${x},${y}`;
const f5 = (t: number, i: number): string => `5,${t},${i}`;
const f6 = (t: number, i: number, x: number, y: number): string =>
	`6,${t},${i},${x},${y}`;
const fs3 = (i: number, x: number, y: number): string =>
	`3,${SENTINEL},${i},${x},${y}`;
const fs5 = (i: number): string => `5,${SENTINEL},${i}`;
const fs6 = (i: number, x: number, y: number): string =>
	`6,${SENTINEL},${i},${x},${y}`;

const ri = (min: number, max: number): number =>
	Math.floor(Math.random() * (max - min + 1)) + min;

/** 三阶贝塞尔鼠标路径（含起步抖动），与原实现一致 */
function bezierPath(
	sx: number,
	sy: number,
	ex: number,
	ey: number,
	n: number,
): Array<{ x: number; y: number }> {
	const c1x = sx + (ex - sx) * 0.3 + ri(-80, 80);
	const c1y = sy + (ey - sy) * 0.2 + ri(-60, 60);
	const c2x = sx + (ex - sx) * 0.7 + ri(-60, 60);
	const c2y = sy + (ey - sy) * 0.8 + ri(-40, 40);

	const pts: Array<{ x: number; y: number }> = [];
	for (let i = 0; i <= n; i += 1) {
		const t = i / n;
		const u = 1 - t;
		const x =
			u * u * u * sx +
			3 * u * u * t * c1x +
			3 * u * t * t * c2x +
			t * t * t * ex;
		const y =
			u * u * u * sy +
			3 * u * u * t * c1y +
			3 * u * t * t * c2y +
			t * t * t * ey;
		const jitter = Math.max(0.5, 3 - t * 2.5);
		pts.push({
			x: x + (Math.random() - 0.5) * jitter,
			y: y + (Math.random() - 0.5) * jitter,
		});
	}
	return pts;
}

/** 生成 EDT 明文中的 data 字段（事件流编码） */
function generateEDTData(opts: {
	startX: number;
	startY: number;
	endX: number;
	endY: number;
	mousePoints: number;
}): string {
	const { startX, startY, endX, endY, mousePoints } = opts;
	const entries: string[] = [];
	let ts = 0;
	let ei = 0;

	entries.push(f5(0, 0));
	entries.push(fs5(0));
	entries.push(f5(0, 0));
	entries.push(fs5(0));

	ts += ri(5, 20);
	entries.push(f6(ts, ei, 750, 500));
	entries.push(fs6(ei, 750, 500));
	ei += 1;

	for (let i = 0; i < 3; i += 1) {
		ts += ri(80, 600);
		entries.push(f5(ts, ei));
		entries.push(fs5(ei));
		ei += 1;
	}

	const path = bezierPath(startX, startY, endX, endY, mousePoints);
	let si = 0;
	for (let i = 0; i < path.length; i += 1) {
		const { x, y } = path[i];
		ts += ri(8, 50);
		entries.push(f3(ts, si, Math.round(x), Math.round(y)));
		entries.push(fs3(si, Math.round(x), Math.round(y)));

		if (i > 0 && i % 12 === 0) {
			ts += ri(20, 60);
			entries.push(f5(ts, ei));
			entries.push(fs5(ei));
			ei += 1;
		}
		si = (si + 1) % 2;
	}

	ts += ri(5, 30);
	entries.push(
		f3(ts, 1, Math.round(endX + ri(-5, 5)), Math.round(endY + ri(-5, 5))),
	);
	entries.push(fs3(1, Math.round(endX), Math.round(endY)));

	return entries.join(":");
}

export interface SimulateResult {
	/** AES-128-CBC 加密的行为数据（Base64） */
	edt: string;
	/** RSA-OAEP-SHA256 加密的 AES 密钥（Base64） */
	sid: string;
}

/**
 * 生成模拟行为指纹。明文格式与原实现一致：
 * mid=xxx;userid=xxx;dfid=xxx;webgl=xxx;webdriver=0;ts=xxx;data=xxx
 */
export function generateSimulate(
	mid: string | number,
	userid: string | number,
	dfid: string | number,
	webglHash?: string,
): SimulateResult {
	SENTINEL = 0xffffffff - Math.floor(Math.random() * 20);

	// 随机 AES-128 密钥：16 字节随机串的 MD5 前 16 字符
	const key = cryptoMd5(randomString(16)).substring(0, 16);

	const points = ri(30, 60);
	const startX = ri(200, 600);
	const startY = ri(200, 500);
	const endX = ri(500, 700);
	const endY = ri(80, 150);

	const midV = mid || 0;
	const useridV = userid || 0;
	const dfidV = dfid || 0;
	const webgl = webglHash || generateWebGLHash();
	const ts = Date.now();

	const data = generateEDTData({
		startX,
		startY,
		endX,
		endY,
		mousePoints: points,
	});
	const plaintext = `mid=${midV};userid=${useridV};dfid=${dfidV};webgl=${webgl};webdriver=0;ts=${ts};data=${data}`;

	// EDT：AES-128-CBC/PKCS7，固定 IV，Base64 输出
	const cipher = createCipheriv(
		"aes-128-cbc",
		Buffer.from(key, "utf8"),
		Buffer.from(SSA_AES_IV, "utf8"),
	);
	const edt = Buffer.concat([
		cipher.update(plaintext, "utf8"),
		cipher.final(),
	]).toString("base64");

	// SID：RSA-OAEP-SHA256 加密 AES 密钥，Base64 输出
	const sid = publicEncrypt(
		{
			key: SSA_PUBLIC_KEY,
			padding: constants.RSA_PKCS1_OAEP_PADDING,
			oaepHash: "sha256",
		},
		Buffer.from(key, "utf8"),
	).toString("base64");

	return { edt, sid };
}
