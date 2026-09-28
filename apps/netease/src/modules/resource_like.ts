// 点赞与取消点赞资源
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
	resourceTypeMap,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	// biome-ignore lint/suspicious/noDoubleEquals: query/upstream values are untyped; loose equality matches original
	query.t = query.t == 1 ? "like" : "unlike";
	query.type = resourceTypeMap[query.type];
	const data = {
		threadId: query.type + query.id,
	};
	if (query.type === "A_EV_2_") {
		data.threadId = query.threadId;
	}
	return request(
		`/api/resource/${query.t}`,
		data,
		createOption(query, "weapi"),
	);
});
