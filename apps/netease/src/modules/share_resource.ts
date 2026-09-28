// 分享歌曲到动态
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		type: query.type || "song", // song,playlist,mv,djprogram,djradio,noresource
		msg: query.msg || "",
		id: query.id || "",
	};
	return request(
		`/api/share/friends/resource`,
		data,
		createOption(query, "xeapi", "v3"),
	);
});
