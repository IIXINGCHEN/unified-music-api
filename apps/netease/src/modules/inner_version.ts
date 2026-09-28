import { defineModule } from "@music-api/ncm-core";
import pkg from "../../package.json" with { type: "json" };
export default defineModule((_query, _request) => {
	return new Promise((resolve) => {
		return resolve({
			code: 200,
			status: 200,
			body: {
				code: 200,
				data: {
					version: pkg.version,
				},
			},
		});
	});
});
