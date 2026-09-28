/**
 * Golden-vector gate for the byte-exact port of util/crypto.js.
 *
 * Vectors in ../vectors/vectors.json were recorded from the ORIGINAL
 * implementation (music-api-audit/repos/api-enhanced/util/crypto.js) with
 * deterministic stubs for Math.random / crypto.randomBytes /
 * crypto.generateKeyPairSync (see /tmp/ncm-vec/gen.mjs). The same stubs are
 * installed here before importing the port, so every vector must deep-equal.
 *
 * Special cases:
 *  - aesDecrypt: the original returns a CryptoJS WordArray; vectors store the
 *    UTF-8 decoded text, so the port's Buffer is decoded before comparing.
 *  - decrypt: NONDETERMINISTIC in the original (random KDF salt per call:
 *    usually '' / sometimes throws 'Malformed UTF-8 data'). The test asserts
 *    the behavior class instead of an exact value, without disturbing the
 *    stub RNG stream used by later vectors.
 */
import crypto from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import vectorsJson from "../vectors/vectors.json";

// ---------------------------------------------------------------------------
// Deterministic stubs (identical to /tmp/ncm-vec/gen.mjs)
// ---------------------------------------------------------------------------
const SEED = 0xc0ffee;
let rngState = SEED;
const resetRng = (seed: number = SEED): void => {
	rngState = seed >>> 0;
};
const nextU32 = (): number => {
	rngState |= 0;
	rngState = (rngState + 0x6d2b79f5) | 0;
	let t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
	t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
	return (t ^ (t >>> 14)) >>> 0;
};

// NOTE: one nextU32() per byte, no batching - exactly like gen.mjs's
// stubRandomBytes, so the stream position stays identical.
const stubRandomBytes = (size: number): Buffer => {
	const buf = Buffer.alloc(size);
	for (let i = 0; i < size; i++) buf[i] = nextU32() & 0xff;
	return buf;
};

const EPH_PUB_JWK = {
	crv: "X25519",
	x: "NvQpFC8U_eg9eUwy9U2zbsVgvHjxdBYtO3PTGqVfKlg",
	kty: "OKP",
};
const EPH_PRIV_JWK = {
	crv: "X25519",
	d: "SNTTPTq9bMMZCdm7ftWe1-P_BS4y65XUZiFp_9FGQEk",
	x: "NvQpFC8U_eg9eUwy9U2zbsVgvHjxdBYtO3PTGqVfKlg",
	kty: "OKP",
};
const fixedPub = crypto.createPublicKey({ key: EPH_PUB_JWK, format: "jwk" });
const fixedPriv = crypto.createPrivateKey({ key: EPH_PRIV_JWK, format: "jwk" });

const cryptoRec = crypto as unknown as Record<string, unknown>;
const realMathRandom = Math.random;
const realRandomBytes = cryptoRec.randomBytes;
const realGenKeyPairSync = cryptoRec.generateKeyPairSync;

Math.random = () => nextU32() / 0x100000000;
cryptoRec.randomBytes = stubRandomBytes;
cryptoRec.generateKeyPairSync = () => ({
	publicKey: fixedPub,
	privateKey: fixedPriv,
});

afterAll(() => {
	Math.random = realMathRandom;
	cryptoRec.randomBytes = realRandomBytes;
	cryptoRec.generateKeyPairSync = realGenKeyPairSync;
});

// Import AFTER stubs are installed (the port reads crypto.* at call time,
// but Math.random is captured per call - either way this ordering is safe).
const mod = (await import("./index.js")) as Record<
	string,
	(...args: never[]) => unknown
>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
interface Vector {
	fn: string;
	input: unknown[];
	output: unknown;
	note?: string;
}

/** Revive Buffers serialized by JSON.stringify(Buffer). */
const revive = (v: unknown): unknown => {
	if (Array.isArray(v)) return v.map(revive);
	if (v !== null && typeof v === "object") {
		const o = v as Record<string, unknown>;
		if (o.type === "Buffer" && Array.isArray(o.data)) {
			return Buffer.from(o.data as number[]);
		}
		return Object.fromEntries(
			Object.entries(o).map(([k, val]) => [k, revive(val)]),
		);
	}
	return v;
};

const RANDOM_FNS = new Set(["weapi", "xeapi"]);

describe("golden vectors (byte-exact port of util/crypto.js)", () => {
	for (const vec of vectorsJson as Vector[]) {
		it(`${vec.fn} ${JSON.stringify(vec.input).slice(0, 72)}`, () => {
			if (vec.fn === "decrypt") {
				// Nondeterministic in the original: assert the behavior class only,
				// and restore the stub RNG state afterwards so later vectors are
				// unaffected (the original's decrypt never touched this stream).
				const savedRng = rngState;
				try {
					let sawString = false;
					for (let i = 0; i < 10; i++) {
						try {
							const out = (mod.decrypt as (c: string) => string)(
								vec.input[0] as string,
							);
							expect(typeof out).toBe("string");
							sawString = true;
						} catch (e) {
							expect((e as Error).message).toMatch(/Malformed UTF-8/);
						}
					}
					expect(sawString).toBe(true);
				} finally {
					rngState = savedRng;
				}
				return;
			}

			// gen.mjs called resetRng() before every vector; rngState is
			// intentionally NOT reset here otherwise (it flows continuously,
			// exactly like the generator).
			if (RANDOM_FNS.has(vec.fn)) resetRng();
			const args = vec.input.map(revive);
			if (vec.fn === "xeapiResDecrypt") {
				// vector stores base64 + encoding note; the function takes a Buffer
				args[0] = Buffer.from(args[0] as string, "base64");
			}
			let output: unknown = (mod[vec.fn] as (...a: unknown[]) => unknown)(
				...args,
			);
			if (vec.fn === "aesDecrypt") {
				output = (output as Buffer).toString("utf8");
			}
			expect(output).toEqual(vec.output);
		});
	}
});
