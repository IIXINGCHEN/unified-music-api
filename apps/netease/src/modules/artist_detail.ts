import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";
export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	return request(
		`/api/artist/head/info/get`,
		{
			id: query.id,
		},
		createOption(query),
	);
});
