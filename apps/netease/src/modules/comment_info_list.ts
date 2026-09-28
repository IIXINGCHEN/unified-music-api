// 评论统计数据
// type: 0=歌曲 1=MV 2=歌单 3=专辑 4=电台节目 5=视频 6=动态 7=电台
// ids: 资源 ID 列表，多个用逗号分隔，如 "123,456"
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
	resourceTypeMap,
} from "@music-api/ncm-core";

// 从 resourceTypeMap 的前缀值中提取网易云内部资源类型编号
// 例如 "R_SO_4_" -> "4", "A_DR_14_" -> "14"
const resourceTypeIdMap = Object.fromEntries(
	Object.entries(resourceTypeMap).map(([key, prefix]) => [
		key,
		prefix.replace(/_$/, "").split("_").pop(),
	]),
);

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const ids = String(query.ids || query.id || "")
		.split(",")
		.map((id) => id.trim())
		.filter(Boolean);

	return request(
		`/api/resource/commentInfo/list`,
		{
			resourceType: resourceTypeIdMap[String(query.type || 0)],
			resourceIds: JSON.stringify(ids),
		},
		createOption(query, "weapi"),
	);
});
