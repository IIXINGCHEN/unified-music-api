// 歌单导入 - 元数据/文字/链接导入
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	// biome-ignore lint/suspicious/noExplicitAny: upstream JSON is untyped
	let data: Record<string, any> = {
		importStarPlaylist: query.importStarPlaylist || false, // 导入我喜欢的音乐
	};

	if (query.local) {
		// 元数据导入
		const local = JSON.parse(query.local);
		const multiSongs = JSON.stringify(
			// biome-ignore lint/suspicious/noExplicitAny: upstream JSON is untyped
			local.map((e: any) => ({
				songName: e.name,
				artistName: e.artist,
				albumName: e.album,
			})),
		);
		data = {
			...data,
			multiSongs: multiSongs,
		};
	} else {
		const playlistName = // 歌单名称
			query.playlistName || "导入音乐 ".concat(new Date().toLocaleString());
		let songs = "";
		if (query.text) {
			// 文字导入
			songs = JSON.stringify([
				{
					name: playlistName,
					type: "",
					url: encodeURI("rpc://playlist/import?text=".concat(query.text)),
				},
			]);
		}

		if (query.link) {
			// 链接导入
			const link = JSON.parse(query.link);
			songs = JSON.stringify(
				// biome-ignore lint/suspicious/noExplicitAny: upstream JSON is untyped
				link.map((e: any) => ({
					name: playlistName,
					type: "",
					url: encodeURI(e),
				})),
			);
		}
		data = {
			...data,
			playlistName: playlistName,
			createBusinessCode: undefined,
			extParam: undefined,
			taskIdForLog: "",
			songs: songs,
		};
	}
	return request(
		`/api/playlist/import/name/task/create`,
		data,
		createOption(query),
	);
});
