// 相关歌单
import {
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule(async (query: NcmQuery, _request: NcmRequestFn) => {
	const resp = await fetch(`https://music.163.com/playlist?id=${query.id}`);
	if (!resp.ok) {
		throw new Error(`Request failed with status code ${resp.status}`);
	}
	const html = await resp.text();
	// Shape mirrors the original axios response object with `body` attached.
	const res: {
		status: number;
		data: string;
		body?: unknown;
	} = { status: resp.status, data: html };
	try {
		const pattern =
			/<div class="cver u-cover u-cover-3">[\s\S]*?<img src="([^"]+)">[\s\S]*?<a class="sname f-fs1 s-fc0" href="([^"]+)"[^>]*>([^<]+?)<\/a>[\s\S]*?<a class="nm nm f-thide s-fc3" href="([^"]+)"[^>]*>([^<]+?)<\/a>/g;
		let result: RegExpExecArray | null;
		const playlists: unknown[] = [];
		// biome-ignore lint/suspicious/noAssignInExpressions: idiomatic RegExp exec loop, matches original
		while ((result = pattern.exec(res.data)) != null) {
			playlists.push({
				creator: {
					userId: result[4].slice("/user/home?id=".length),
					nickname: result[5],
				},
				coverImgUrl: result[1].slice(0, -"?param=50y50".length),
				name: result[3],
				id: result[2].slice("/playlist?id=".length),
			});
		}
		res.body = { code: 200, playlists: playlists };
		return res;
	} catch (err) {
		res.status = 500;
		res.body = { code: 500, msg: (err as Error).stack };
		return Promise.reject(res);
	}
});
