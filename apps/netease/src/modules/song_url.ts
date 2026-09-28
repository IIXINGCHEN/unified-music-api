// 歌曲链接
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule(async (query: NcmQuery, request: NcmRequestFn) => {
	const ids = String(query.id).split(",");
	const data = {
		ids: JSON.stringify(ids),
		br: parseInt(query.br || 999000, 10),
	};
	const res = await request(
		`/api/song/enhance/player/url`,
		data,
		createOption(query),
	);
	// 根据id排序
	const result: Array<{ id: string | number }> = res.body.data;
	result.sort((a, b) => {
		return ids.indexOf(String(a.id)) - ids.indexOf(String(b.id));
	});
	return {
		status: 200,
		body: {
			code: 200,
			data: result,
		},
	};
});
