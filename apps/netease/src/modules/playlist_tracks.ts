// 收藏单曲到歌单 从歌单删除歌曲
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule(async (query: NcmQuery, request: NcmRequestFn) => {
	//
	const tracks = query.tracks.split(",");
	const data = {
		op: query.op, // del,add
		pid: query.pid, // 歌单id
		trackIds: JSON.stringify(tracks), // 歌曲id
		imme: "true",
	};

	try {
		const res = await request(
			`/api/playlist/manipulate/tracks`,
			data,
			createOption(query),
		);
		return {
			status: 200,
			body: {
				...res,
			},
		};
	} catch (error) {
		// biome-ignore lint/suspicious/noExplicitAny: upstream JSON is untyped
		const errBody: any = (error as { body?: any }).body;
		if (errBody.code === 512) {
			return request(
				`/api/playlist/manipulate/tracks`,
				{
					op: query.op, // del,add
					pid: query.pid, // 歌单id
					trackIds: JSON.stringify([...tracks, ...tracks]),
					imme: "true",
				},
				createOption(query),
			);
		} else {
			return {
				status: 200,
				body: errBody,
			};
		}
	}
});
