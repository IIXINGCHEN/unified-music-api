// 通过传过来的歌单id拿到所有歌曲数据
// 支持传递参数limit来限制获取歌曲的数据数量 例如: /playlist/track/all?id=7044354223&limit=10
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		id: query.id,
		n: 100000,
		s: query.s || 8,
	};
	//不放在data里面避免请求带上无用的数据
	const limit = parseInt(query.limit, 10) || 1000;
	const offset = parseInt(query.offset, 10) || 0;

	return request(`/api/v6/playlist/detail`, data, createOption(query)).then(
		(res) => {
			const trackIds: Array<{ id: string | number }> =
				res.body.playlist.trackIds;
			const idsData = {
				c:
					"[" +
					trackIds
						.slice(offset, offset + limit)
						.map((item) => `{"id":${item.id}}`)
						.join(",") +
					"]",
			};

			return request(`/api/v3/song/detail`, idsData, createOption(query));
		},
	);
});
