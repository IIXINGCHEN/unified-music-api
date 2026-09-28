// 购买数字专辑
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		business: "Album",
		paymentMethod: query.payment,
		digitalResources: JSON.stringify([
			{
				business: "Album",
				resourceID: query.id,
				quantity: query.quantity,
			},
		]),
		from: "web",
	};
	return request(
		`/api/ordering/web/digital`,
		data,
		createOption(query, "weapi"),
	);
});
