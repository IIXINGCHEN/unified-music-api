import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";
export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		userId: query.uid,
		songId: query.sid,
		adjustSongId: query.asid,
	};
	return request(
		`/api/cloud/user/song/match`,
		data,
		createOption(query, "weapi"),
	);
});
