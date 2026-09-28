// 一起听 发送播放状态
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		roomId: query.roomId,
		commandInfo: JSON.stringify({
			commandType: query.commandType,
			progress: query.progress || 0,
			playStatus: query.playStatus,
			formerSongId: query.formerSongId,
			targetSongId: query.targetSongId,
			clientSeq: query.clientSeq,
		}),
	};
	return request(
		`/api/listen/together/play/command/report`,
		data,
		createOption(query),
	);
});
