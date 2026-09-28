/** KuGou API service entrypoint — `node dist/main.js` / `tsx watch src/main.ts`. */
import { startService } from "./server.js";

startService().catch((err) => {
	console.error("Failed to start kugou service:", err);
	process.exit(1);
});
