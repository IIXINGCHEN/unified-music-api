// 副歌时间
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	return request(
		`/api/song/chorus`,
		{
			ids: JSON.stringify([query.id]),
		},
		createOption(query),
	);
});
