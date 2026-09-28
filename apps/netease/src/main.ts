/**
 * Service entry point — port of api-enhanced/app.js.
 *
 * Original app.js: dotenv → generateConfig() (refresh anonymous_token +
 * xeapi key in os.tmpdir()) → server.serveNcmApi().
 */
import "dotenv/config";
import { generateConfig } from "./generateConfig.js";
import { serveNcmApi } from "./server.js";

await generateConfig();
await serveNcmApi({ checkVersion: true });
