/**
 * Client IP extraction — port of the trust-proxy + ::ffff: handling in both
 * servers' route handlers.
 *
 * Original netease:
 *   ip = req.ip; if (ip.substring(0,7) == '::ffff:') ip = ip.substring(7);
 *   (express with 'trust proxy' → req.ip is the leftmost X-Forwarded-For)
 * Original kugou: same ::ffff: strip (no ::1 special-case).
 */
import type { Context } from "hono";

export function getClientIp(c: Context): string {
	const xff = c.req.header("x-forwarded-for");
	let ip = "";
	if (xff) {
		ip = xff.split(",")[0].trim();
	} else {
		ip = c.req.header("x-real-ip") || "";
	}
	if (!ip) {
		// @hono/node-server exposes the raw Node request as c.env.incoming.
		const incoming = (c.env as Record<string, unknown> | undefined)?.incoming as
			| { socket?: { remoteAddress?: string } }
			| undefined;
		ip = incoming?.socket?.remoteAddress || "";
	}
	if (ip.substring(0, 7) === "::ffff:") ip = ip.substring(7);
	return ip;
}
