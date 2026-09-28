/**
 * Image upload plugin for @music-api/netease.
 * Port of api-enhanced/plugins/upload.js (axios -> fetch).
 */
import {
	createOption,
	getUploadData,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

interface UploadInfo {
	url_pre: string;
	imgId: unknown;
}

export default async function uploadPlugin(
	query: NcmQuery,
	request: NcmRequestFn,
): Promise<UploadInfo> {
	const data = {
		bucket: "yyimgs",
		ext: "jpg",
		filename: query.imgFile.name,
		local: false,
		nos_product: 0,
		return_body: `{"code":200,"size":"$(ObjectSize)"}`,
		type: "other",
	};
	const res = await request(
		`/api/nos/token/alloc`,
		data,
		createOption(query, "weapi"),
	);

	// NOTE: original does not check the upload response; errors propagate.
	await fetch(
		`https://nosup-hz1.127.net/yyimgs/${res.body.result.objectKey}?offset=0&complete=true&version=1.0`,
		{
			method: "POST",
			headers: {
				"x-nos-token": res.body.result.token,
				"Content-Type": query.imgFile.mimetype || "image/jpeg",
			},
			body: getUploadData(query.imgFile) as unknown as BodyInit,
		},
	);

	return {
		url_pre: `https://p1.music.126.net/${res.body.result.objectKey}`,
		imgId: res.body.result.docId,
	};
}
