// 助眠解压 - 查看同类推荐
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		id: query.id,
	};
	return request(
		`/api/voice/sati/resource/list/more/v1`,
		data,
		createOption(query),
	);
});
