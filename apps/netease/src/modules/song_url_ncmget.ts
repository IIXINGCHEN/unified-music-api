// 夹带私货的东西就不要放在这里了
import {
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule(
	async (_query: NcmQuery, _request: NcmRequestFn) => {
		return { status: 200, body: { code: 200, data: [] } };
	},
);
