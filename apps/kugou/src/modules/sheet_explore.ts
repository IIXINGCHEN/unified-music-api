// Ported from KuGouMusicApi/module/sheet_explore.js — behavior identical to the original.
import { defineKgModule, type KgRequestFn } from "@music-api/kugou-core";
// 乐谱 推荐 3、钢琴（0：基础，1：进阶)，1、吉他(1: 进阶, 2：基础，0：中级)，2、尤克里里（0：基础，1：进阶），4：简谱（0：基础）
export default defineKgModule(
	(params: Record<string, any>, useAxios: KgRequestFn) => {
		return useAxios({
			url: "/opern/v1/home/get_rec_opern",
			method: "POST",
			encryptType: "android",
			data: { exposure_mixids: "" },
			params: {
				pagesize: params?.pagesize || 30,
				page: params?.page || 1,
				opern_level: params.level || 0,
				instruments: params?.instruments || 1,
				tagid: params?.tagid || 0,
			},
			cookie: params?.cookie || {},
		});
	},
);
