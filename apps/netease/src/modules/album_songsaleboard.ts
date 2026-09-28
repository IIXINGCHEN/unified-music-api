// 数字专辑&数字单曲-榜单
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	// biome-ignore lint/suspicious/noExplicitAny: upstream JSON is untyped
	let data: Record<string, any> = {
		albumType: query.albumType || 0, //0为数字专辑,1为数字单曲
	};
	const type = query.type || "daily"; // daily,week,year,total
	if (type === "year") {
		data = {
			...data,
			year: query.year,
		};
	}
	return request(
		`/api/feealbum/songsaleboard/${type}/type`,
		data,
		createOption(query, "weapi"),
	);
});
