// 歌曲百科
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const extJson = {
		states: {
			playingResource: {
				current: query.id,
				scene: "songWiki",
			},
		},
	};
	const data = {
		extJson: JSON.stringify(extJson),
		positionCode: "songWikiMainPosition",
	};
	return request(
		`/api/link/page/parent/relation/construct/info`,
		data,
		createOption(query, "eapi"),
	);
});
