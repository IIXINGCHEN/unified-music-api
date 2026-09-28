/**
 * Unified JSON envelope: { code, message, data?, timestamp }.
 *
 * Mirrors Go `pkg/response`: success uses code 200 / HTTP 200; `data` is
 * omitted when undefined/null (Go `omitempty`).
 */
import type { Context } from "hono";

export interface Envelope<T = unknown> {
	code: number;
	message: string;
	data?: T;
	timestamp: number;
}

function envelope<T>(code: number, message: string, data?: T): Envelope<T> {
	const body: Envelope<T> = {
		code,
		message,
		timestamp: Math.floor(Date.now() / 1000),
	};
	if (data !== undefined && data !== null) body.data = data;
	return body;
}

/** Send the envelope with a given HTTP status. */
export function send<T>(
	c: Context,
	httpStatus: number,
	code: number,
	message: string,
	data?: T,
) {
	return c.json(envelope(code, message, data), httpStatus as never);
}

/** 200 + code 200 envelope. */
export function ok<T>(c: Context, message: string, data?: T) {
	return send(c, 200, 200, message, data);
}

/** Error envelope with explicit HTTP status + business code. */
export function fail(
	c: Context,
	httpStatus: number,
	code: number,
	message: string,
) {
	return send(c, httpStatus, code, message);
}

export const badRequest = (c: Context, message: string) =>
	fail(c, 400, 400, message);
export const unauthorized = (c: Context, message: string) =>
	fail(c, 401, 401, message);
export const forbidden = (c: Context, message: string) =>
	fail(c, 403, 403, message);
export const notFound = (c: Context, message: string) =>
	fail(c, 404, 404, message);
export const internalError = (c: Context, message: string) =>
	fail(c, 500, 500, message);
export const serviceUnavailable = (c: Context, message: string) =>
	fail(c, 503, 503, message);
