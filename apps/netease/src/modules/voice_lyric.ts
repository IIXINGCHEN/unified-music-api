import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";
export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		programId: query.id,
	};
	return request(`/api/voice/lyric/get`, data, createOption(query));
});
