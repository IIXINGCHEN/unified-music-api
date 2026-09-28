import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";
export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		userTaskId: query.userTaskId,
		depositCode: query.depositCode || "0",
	};
	return request(
		`/api/usertool/task/point/receive`,
		data,
		createOption(query, "weapi"),
	);
});
