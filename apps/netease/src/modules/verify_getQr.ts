import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule(async (query: NcmQuery, request: NcmRequestFn) => {
	// qrcode 未安装时与原 require 一致：调用即抛错
	const { default: QRCode } = await import("qrcode");
	const data = {
		verifyConfigId: query.vid,
		verifyType: query.type,
		token: query.token,
		params: JSON.stringify({
			event_id: query.evid,
			sign: query.sign,
		}),
		size: 150,
	};

	const res = await request(
		`/api/frontrisk/verify/getqrcode`,
		data,
		createOption(query, "weapi"),
	);
	const result = `https://st.music.163.com/encrypt-pages?qrCode=${
		res.body.data.qrCode
	}&verifyToken=${query.token}&verifyId=${query.vid}&verifyType=${
		query.type
	}&params=${JSON.stringify({
		event_id: query.evid,
		sign: query.sign,
	})}`;
	return {
		status: 200,
		body: {
			code: 200,
			data: {
				qrCode: res.body.data.qrCode,
				qrurl: result,
				qrimg: await QRCode.toDataURL(result),
			},
		},
	};
});
