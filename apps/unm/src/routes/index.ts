import { Hono } from "hono";
import type { AppEnv } from "../types/typeApi.js";
import { infoRoute } from "./routeInfo.js";
import { monitorRoute } from "./routeMonitor.js";
import { musicRoute } from "./routeMusic.js";
import { resourceRoute } from "./routeResource.js";

const routes = new Hono<AppEnv>();

routes.route("/", infoRoute);
routes.route("/", musicRoute);
routes.route("/", resourceRoute);
routes.route("/", monitorRoute);

export { infoRoute, monitorRoute, musicRoute, resourceRoute, routes };
