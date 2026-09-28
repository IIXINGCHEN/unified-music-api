// 年度听歌报告2017-2023
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {};
	const key =
		["2017", "2018", "2019"].indexOf(query.year) > -1 ? "userdata" : "data";
	return request(
		`/api/activity/summary/annual/${query.year}/${key}`,
		data,
		createOption(query),
	);
});
