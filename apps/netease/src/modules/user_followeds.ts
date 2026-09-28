// 关注TA的人(粉丝)
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		userId: query.uid,
		time: "0",
		limit: query.limit || 20,
		offset: query.offset || 0,
		getcounts: "true",
	};
	return request(
		`/api/user/getfolloweds/${query.uid}`,
		data,
		createOption(query),
	);
});
