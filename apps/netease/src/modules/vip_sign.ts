// 黑胶乐签打卡
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule(async (query: NcmQuery, request: NcmRequestFn) => {
	// biome-ignore lint/suspicious/noExplicitAny: upstream JSON is untyped
	const results: Record<string, any> = {};

	const taskSign = await request(
		"/api/vip-center-bff/task/sign",
		{},
		createOption(query, "weapi"),
	);
	results.taskSign = taskSign.body;

	const checkinDetail = await request(
		"/api/vipnewcenter/app/level/user/checkin/history/detail",
		{
			signDayTime: Date.now(),
			type: 1,
		},
		createOption(query, "eapi"),
	);
	results.checkinDetail = checkinDetail.body;

	// 两个接口都返回 code=200 即视为打卡成功
	const signed =
		Number(results.taskSign?.code) === 200 &&
		Number(results.checkinDetail?.code) === 200;

	return {
		body: {
			code: 200,
			...results,
			signed,
			message: signed ? "黑胶乐签打卡成功" : "黑胶乐签打卡失败",
		},
		cookie: taskSign.cookie,
		status: 200,
	};
});
