// 一起听 更新播放列表
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		roomId: query.roomId,
		playlistParam: JSON.stringify({
			commandType: query.commandType,
			version: [
				{
					userId: query.userId,
					version: query.version,
				},
			],
			anchorSongId: "",
			anchorPosition: -1,
			randomList: query.randomList.split(","),
			displayList: query.displayList.split(","),
		}),
	};
	return request(
		`/api/listen/together/sync/list/command/report`,
		data,
		createOption(query),
	);
});
