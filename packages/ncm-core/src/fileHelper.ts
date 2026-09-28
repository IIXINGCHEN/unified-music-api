/**
 * Port of api-enhanced/util/fileHelper.js.
 * File-upload helpers shared by modules that accept song/cover uploads.
 */
import { createHash } from "node:crypto";
import {
	createReadStream,
	existsSync,
	readFileSync,
	statSync,
	unlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";

export interface MemoryFile {
	data: Buffer;
	name?: string;
	tempFilePath?: string;
	md5?: string | (() => string);
	mv?: (dest: string, cb: (err: Error | null) => void) => void;
}

export interface FileLike {
	data?: Buffer;
	name?: string;
	tempFilePath?: string;
}

export const isTempFile = (file: FileLike | null | undefined): boolean => {
	return Boolean(file?.tempFilePath && !file?.data);
};

export const getFileSize = (file: FileLike): number => {
	if (file.data) {
		return file.data.length;
	}
	if (file.tempFilePath) {
		try {
			return statSync(file.tempFilePath).size;
		} catch {
			return 0;
		}
	}
	return 0;
};

export const getFileMd5 = (file: FileLike): string => {
	if (file.data) {
		return createHash("md5").update(file.data).digest("hex");
	}
	if (file.tempFilePath) {
		try {
			const data = readFileSync(file.tempFilePath);
			return createHash("md5").update(data).digest("hex");
		} catch {
			return "";
		}
	}
	return "";
};

export const getUploadData = (file: FileLike): Buffer => {
	if (file.data) {
		return file.data;
	}
	if (file.tempFilePath) {
		return readFileSync(file.tempFilePath);
	}
	throw new Error("No file data available");
};

export const cleanupTempFile = (file: FileLike | null | undefined): void => {
	if (file?.tempFilePath) {
		try {
			if (existsSync(file.tempFilePath)) {
				unlinkSync(file.tempFilePath);
			}
		} catch {
			// ignore cleanup errors
		}
	}
};

/**
 * Express-fileupload style upload helper: supports both memory files
 * (file.data) and temp files (file.tempFilePath), like the original.
 */
export const uploadFile = async (
	req: {
		files?: Record<string, MemoryFile | MemoryFile[] | undefined>;
	},
	key = "file",
): Promise<MemoryFile> => {
	if (!req.files?.[key]) {
		throw new Error(`No file uploaded with key: ${key}`);
	}

	const file = req.files[key] as MemoryFile | MemoryFile[];
	const fileData = Array.isArray(file) ? file[0] : file;

	if (fileData.data) {
		return fileData;
	}

	if (fileData.tempFilePath) {
		const buffer = readFileSync(fileData.tempFilePath);
		return { data: buffer, name: fileData.name };
	}

	if (fileData.mv) {
		const tempPath = join(
			tmpdir(),
			`upload_${Date.now()}_${Math.random().toString(36).slice(2)}`,
		);
		await new Promise<void>((resolve, reject) => {
			(fileData.mv as (dest: string, cb: (err: Error | null) => void) => void)(
				tempPath,
				(err) => (err ? reject(err) : resolve()),
			);
		});
		const buffer = readFileSync(tempPath);
		return { data: buffer, name: fileData.name };
	}

	throw new Error("Uploaded file has no usable data");
};

export const readFileChunk = (
	file: FileLike,
	offset: number,
	length: number,
): Promise<Buffer> => {
	return new Promise((resolve, reject) => {
		if (file.data) {
			resolve(file.data.subarray(offset, offset + length));
			return;
		}
		if (file.tempFilePath) {
			const stream = createReadStream(file.tempFilePath, {
				start: offset,
				end: offset + length - 1,
			});
			const chunks: Buffer[] = [];
			stream.on("data", (chunk: string | Buffer) => {
				chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
			});
			stream.on("end", () => resolve(Buffer.concat(chunks)));
			stream.on("error", reject);
			return;
		}
		reject(new Error("No file data available"));
	});
};

export const getFileExtension = (filename: string): string => {
	return extname(filename || "").toLowerCase();
};

export const sanitizeFilename = (filename: string): string => {
	return (filename || "")
		.replace(/[<>:"/\\|?*]/g, "_")
		.replace(/\s+/g, "_")
		.substring(0, 255);
};
