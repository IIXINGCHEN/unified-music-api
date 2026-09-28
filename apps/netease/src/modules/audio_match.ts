import {
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule(async (query: NcmQuery, _request: NcmRequestFn) => {
	const resp = await fetch(
		`https://interface.music.163.com/api/music/audio/match?sessionId=0123456789abcdef&algorithmCode=shazam_v2&duration=${
			query.duration
		}&rawdata=${encodeURIComponent(query.audioFP)}&times=1&decrypt=1`,
	);
	if (!resp.ok) {
		throw new Error(`Request failed with status code ${resp.status}`);
	}
	const res = await resp.json();
	return {
		status: 200,
		body: {
			code: 200,
			data: res.data,
		},
	};
});
