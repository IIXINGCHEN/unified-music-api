// 插播相似歌曲
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		positionCode: "toolBarRcmdSong",
		resourceId: query.id,
		resourceType: "song",
	};
	return request(
		`/api/link/position/show/resource`,
		data,
		createOption(query, "eapi"),
	);
});
