// 收藏单曲到歌单 从歌单删除歌曲
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule(async (query: NcmQuery, request: NcmRequestFn) => {
	query.ids = query.ids || "";
	const data = {
		id: query.id,
		tracks: JSON.stringify(
			String(query.ids)
				.split(",")
				.map((item) => {
					return { type: 3, id: item };
				}),
		),
	};

	return request(
		`/api/playlist/track/delete`,
		data,
		createOption(query, "weapi"),
	);
});
