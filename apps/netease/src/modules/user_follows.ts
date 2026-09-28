// TA关注的人(关注)
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		offset: query.offset || 0,
		limit: query.limit || 30,
		order: true,
	};
	return request(
		`/api/user/getfollows/${query.uid}`,
		data,
		createOption(query, "weapi"),
	);
});
