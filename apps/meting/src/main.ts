/**
 * Service entry point — port of Meting-API/node.js.
 */
import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { getHost, getPort } from "./config.js";

const port = getPort();
const host = getHost();

serve(
	{
		fetch: app.fetch,
		port,
		hostname: host === "" ? undefined : host,
	},
	(info) => {
		console.log(
			`Meting API server running @ http://${host || "localhost"}:${info.port}`,
		);
	},
);
