import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";
import { logger } from "../logger.js";
export default defineModule(async (query: NcmQuery, request: NcmRequestFn) => {
	query.ids = query.ids || "";
	const data = {
		id: query.pid,
		tracks: JSON.stringify(
			String(query.ids)
				.split(",")
				.map((item) => {
					return { type: 3, id: item };
				}),
		),
	};
	logger.info(data);

	return request(`/api/playlist/track/add`, data, createOption(query, "weapi"));
});
