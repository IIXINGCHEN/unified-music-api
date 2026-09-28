// 关注与取消关注用户
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	// biome-ignore lint/suspicious/noDoubleEquals: query/upstream values are untyped; loose equality matches original
	query.t = query.t == 1 ? "follow" : "delfollow";
	return request(
		`/api/user/${query.t}/${query.id}`,
		{},
		createOption(query, "weapi"),
	);
});
