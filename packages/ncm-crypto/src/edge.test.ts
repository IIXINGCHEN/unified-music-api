/**
 * Edge/error-path tests for the ncm-crypto port (complements golden.test.ts).
 * Covers the defensive branches that golden vectors don't hit.
 */
import crypto from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { eapiKey } from "./constants.js";
import {
	aesEncrypt,
	eapiReqDecrypt,
	eapiResDecrypt,
	rsaEncrypt,
	xeapi,
} from "./index.js";

describe("error paths", () => {
	it("eapiResDecrypt returns null on undecryptable input", () => {
		vi.spyOn(console, "log").mockImplementation(() => {});
		try {
			expect(eapiResDecrypt("not-valid-hex!!")).toBeNull();
		} finally {
			vi.restoreAllMocks();
		}
	});

	it("eapiReqDecrypt returns null when the envelope markers are absent", () => {
		const params = aesEncrypt(
			"plain json without markers",
			"ecb",
			eapiKey,
			"",
			"hex",
		);
		expect(eapiReqDecrypt(params)).toBeNull();
	});

	it("xeapi throws without publicKeyState", () => {
		expect(() => xeapi("/api/x", { a: "1" }, {})).toThrow(
			"xeapi publicKeyState is required",
		);
	});

	it("rsaEncrypt throws when the key JWK has no n/e", () => {
		const { publicKey } = crypto.generateKeyPairSync("ec", {
			namedCurve: "prime256v1",
		});
		const pem = publicKey.export({ format: "pem", type: "spki" }).toString();
		expect(() => rsaEncrypt("hello", pem)).toThrow(
			"rsaEncrypt: public key JWK is missing n/e",
		);
	});
});
