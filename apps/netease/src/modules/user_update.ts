// 编辑用户信息
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		// avatarImgId: '0',
		birthday: query.birthday,
		city: query.city,
		gender: query.gender,
		nickname: query.nickname,
		province: query.province,
		signature: query.signature,
	};
	return request(`/api/user/profile/update`, data, createOption(query));
});
