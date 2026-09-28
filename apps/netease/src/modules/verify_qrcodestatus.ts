import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";
export default defineModule(async (query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		qrCode: query.qr,
	};
	const res = await request(
		`/api/frontrisk/verify/qrcodestatus`,
		data,
		createOption(query, "weapi"),
	);
	return res;
});
