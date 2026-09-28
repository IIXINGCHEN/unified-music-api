// 歌曲可用性
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		ids: `[${parseInt(query.id, 10)}]`,
		br: parseInt(query.br || 999000, 10),
	};
	return request(
		`/api/song/enhance/player/url`,
		data,
		createOption(query, "weapi"),
	).then((response) => {
		let playable = false;
		// biome-ignore lint/suspicious/noDoubleEquals: upstream/query values are untyped; loose equality matches original
		if (response.body.code == 200) {
			// biome-ignore lint/suspicious/noDoubleEquals: upstream/query values are untyped; loose equality matches original
			if (response.body.data[0].code == 200) {
				playable = true;
			}
		}
		if (playable) {
			response.body = { code: 200, success: true, message: "ok" };
			return response;
		} else {
			// response.status = 404
			response.body = { code: 200, success: false, message: "亲爱的,暂无版权" };
			return response;
			// return Promise.reject(response)
		}
	});
});
