// 获取客户端歌曲下载链接
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		id: query.id,
		br: parseInt(query.br || 999000, 10),
	};
	return request(`/api/song/enhance/download/url`, data, createOption(query));
});
