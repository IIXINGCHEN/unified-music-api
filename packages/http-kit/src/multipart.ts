/**
 * Multipart/form-data parsing — minimal port of the express-fileupload
 * subset the servers relied on.
 *
 * Original netease config:
 *   fileUpload({ limits: { fileSize: 500MB }, useTempFiles: true,
 *     tempFileDir: os.tmpdir(), abortOnLimit: true, parseNested: true })
 * Kugou had no fileUpload; it used express.raw({ type:
 * 'application/octet-stream', limit: '100mb' }) → req.body === Buffer.
 *
 * Produced file shape mirrors express-fileupload's UploadedFile:
 *   { name, mimetype, size, data: Buffer, tempFilePath, md5, mv }
 * Both `data` (memory) and `tempFilePath` (disk) are populated because the
 * ported modules use both access styles (e.g. voice_upload.ts reads
 * tempFilePath in chunks; others use file.data).
 *
 * DEVIATION: abortOnLimit:true destroyed the socket on oversize uploads;
 * this port returns 413 instead (observable, friendlier, documented).
 */

import { createHash, randomBytes } from "node:crypto";
import { rename, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Context } from "hono";

export interface UploadedFileShape {
	name: string;
	mimetype: string;
	size: number;
	data: Buffer;
	tempFilePath: string;
	md5: string;
	mv: (dest: string, cb?: (err: Error | null) => void) => void;
}

export interface MultipartResult {
	fields: Record<string, unknown>;
	files: Record<string, UploadedFileShape | UploadedFileShape[]>;
}

export interface MultipartOptions {
	maxFileSize?: number;
	tempDir?: string;
}

const DEFAULT_MAX_FILE_SIZE = 500 * 1024 * 1024; // 500mb, like the original

function setNested(obj: Record<string, unknown>, key: string, value: unknown) {
	// parseNested:true — 'a[b][c]' → nested objects (express-fileupload style)
	const parts = key.split(/\[|\]/).filter(Boolean);
	if (parts.length <= 1) {
		obj[key] = value;
		return;
	}
	let cur = obj;
	for (let i = 0; i < parts.length - 1; i++) {
		const p = parts[i];
		if (typeof cur[p] !== "object" || cur[p] === null) cur[p] = {};
		cur = cur[p] as Record<string, unknown>;
	}
	cur[parts[parts.length - 1]] = value;
}

export async function parseMultipart(
	c: Context,
	opts: MultipartOptions = {},
): Promise<MultipartResult> {
	const maxFileSize = opts.maxFileSize ?? DEFAULT_MAX_FILE_SIZE;
	const tempDir = opts.tempDir ?? tmpdir();
	const parsed = await c.req.parseBody();
	const fields: Record<string, unknown> = {};
	const files: Record<string, UploadedFileShape | UploadedFileShape[]> = {};

	const pushFile = (key: string, f: UploadedFileShape) => {
		const prev = files[key];
		if (!prev) files[key] = f;
		else if (Array.isArray(prev)) prev.push(f);
		else files[key] = [prev, f];
	};

	for (const [key, value] of Object.entries(parsed)) {
		const values = Array.isArray(value) ? value : [value];
		for (const v of values) {
			if (typeof v === "string") {
				setNested(fields, key, v);
				continue;
			}
			// File
			const buf = Buffer.from(await (v as File).arrayBuffer());
			if (buf.byteLength > maxFileSize) {
				throw Object.assign(new Error("File size limit exceeded"), {
					status: 413,
				});
			}
			const tempFilePath = join(
				tempDir,
				`upload_${randomBytes(8).toString("hex")}`,
			);
			await writeFile(tempFilePath, buf);
			const file: UploadedFileShape = {
				name: (v as File).name || "file",
				mimetype: (v as File).type || "application/octet-stream",
				size: buf.byteLength,
				data: buf,
				tempFilePath,
				md5: createHash("md5").update(buf).digest("hex"),
				mv: (dest: string, cb?: (err: Error | null) => void) => {
					rename(tempFilePath, dest).then(
						() => cb?.(null),
						(err: Error) => cb?.(err),
					);
				},
			};
			pushFile(key, file);
		}
	}
	return { fields, files };
}

/** Remove temp files created by parseMultipart (best-effort). */
export async function cleanupUploads(result: MultipartResult): Promise<void> {
	const all: UploadedFileShape[] = [];
	for (const v of Object.values(result.files)) {
		if (Array.isArray(v)) all.push(...v);
		else all.push(v);
	}
	await Promise.all(all.map((f) => unlink(f.tempFilePath).catch(() => {})));
}
