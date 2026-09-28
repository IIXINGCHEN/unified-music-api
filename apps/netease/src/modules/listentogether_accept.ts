import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";
export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		refer: "inbox_invite",
		roomId: query.roomId,
		inviterId: query.inviterId,
	};
	return request(
		`/api/listen/together/play/invitation/accept`,
		data,
		createOption(query),
	);
});
