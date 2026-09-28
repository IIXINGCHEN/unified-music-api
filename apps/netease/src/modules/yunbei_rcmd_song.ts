// 云贝推歌
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		songId: query.id,
		reason: query.reason || "好歌献给你",
		scene: "",
		fromUserId: -1,
		yunbeiNum: query.yunbeiNum || 10,
	};
	return request(
		`/api/yunbei/rcmd/song/submit`,
		data,
		createOption(query, "weapi"),
	);
});
