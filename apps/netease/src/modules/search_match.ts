// 本地歌曲匹配音乐信息
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const songs = [
		{
			title: query.title || "",
			album: query.album || "",
			artist: query.artist || "",
			duration: query.duration || 0,
			persistId: query.md5,
		},
	];
	const data = {
		songs: JSON.stringify(songs),
	};
	return request(`/api/search/match/new`, data, createOption(query));
});
