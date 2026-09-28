import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
	cleanupTempFile,
	getFileExtension,
	getFileMd5,
	getFileSize,
	getUploadData,
	isTempFile,
	readFileChunk,
	sanitizeFilename,
	uploadFile,
} from "../src/fileHelper.js";

describe("fileHelper", () => {
	it("isTempFile detects temp-only files", () => {
		expect(isTempFile({ tempFilePath: "/tmp/x" })).toBe(true);
		expect(isTempFile({ data: Buffer.alloc(1), tempFilePath: "/tmp/x" })).toBe(
			false,
		);
		expect(isTempFile(null)).toBe(false);
		expect(isTempFile(undefined)).toBe(false);
	});

	it("getFileSize prefers memory data", () => {
		expect(getFileSize({ data: Buffer.alloc(7) })).toBe(7);
		expect(getFileSize({})).toBe(0);
	});

	it("getFileMd5 hashes memory data", () => {
		const data = Buffer.from("hello");
		expect(getFileMd5({ data })).toBe(
			createHash("md5").update(data).digest("hex"),
		);
		expect(getFileMd5({})).toBe("");
	});

	it("getUploadData returns memory data, throws when empty", () => {
		const data = Buffer.from("abc");
		expect(getUploadData({ data })).toBe(data);
		expect(() => getUploadData({})).toThrow("No file data available");
	});

	it("cleanupTempFile never throws", () => {
		expect(() =>
			cleanupTempFile({ tempFilePath: "/tmp/does-not-exist-ncm" }),
		).not.toThrow();
		expect(() => cleanupTempFile(null)).not.toThrow();
	});

	it("uploadFile returns memory files directly", async () => {
		const file = { data: Buffer.from("x"), name: "a.mp3" };
		await expect(uploadFile({ files: { file } })).resolves.toBe(file);
	});

	it("uploadFile takes the first of an array", async () => {
		const first = { data: Buffer.from("1") };
		const res = await uploadFile({
			files: { file: [first, { data: Buffer.from("2") }] },
		});
		expect(res).toBe(first);
	});

	it("uploadFile throws when the key is missing", async () => {
		await expect(uploadFile({})).rejects.toThrow("No file uploaded");
	});

	it("readFileChunk slices memory data", async () => {
		const chunk = await readFileChunk(
			{ data: Buffer.from("0123456789") },
			2,
			4,
		);
		expect(chunk.toString()).toBe("2345");
	});

	it("readFileChunk rejects without data", async () => {
		await expect(readFileChunk({}, 0, 1)).rejects.toThrow();
	});

	it("getFileExtension lowercases", () => {
		expect(getFileExtension("a.MP3")).toBe(".mp3");
		expect(getFileExtension("noext")).toBe("");
	});

	it("sanitizeFilename strips illegal chars", () => {
		expect(sanitizeFilename('a<b>c:d"e/f\\g|h?i*j k.mp3')).toBe(
			"a_b_c_d_e_f_g_h_i_j_k.mp3",
		);
		expect(sanitizeFilename("")).toBe("");
	});
});
