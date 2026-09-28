import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";
export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		limit: query.limit || "200",
		offset: query.offset || "0",
		voiceListId: query.voiceListId,
	};
	return request(
		`/api/voice/workbench/voices/by/voicelist`,
		data,
		createOption(query),
	);
});
