/**
 * Lyric service entry point — starts the Hono app with @hono/node-server.
 * PORT env (default 3000), HOST env (default "" = all interfaces).
 */
import { serve } from "@hono/node-server";
import { app } from "./index.js";

const port = Number(process.env.PORT || "3000");
const host = process.env.HOST || "";

const server = host
	? serve({ fetch: app.fetch, port, hostname: host })
	: serve({ fetch: app.fetch, port });

console.log(`lyric server running @ http://${host || "localhost"}:${port}`);

export default server;
