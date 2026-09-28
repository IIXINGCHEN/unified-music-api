/**
 * Demo entries for the /test page — port of src/example.js.
 * Only the ported providers (spotify, ytmusic) are listed; the original
 * had these two commented out, with tencent/netease active (both dropped).
 */
export interface ExampleEntry {
	show: boolean;
	value: string;
}

const examples: Record<string, Record<string, ExampleEntry>> = {
	ytmusic: {
		playlist: {
			show: true,
			value: "RDCLAK5uy_l12ynH8dyLsBmE11ToAHLm9P04NS2i9ME",
		},
		song: { show: true, value: "G3s98l2-GXg" },
	},
	spotify: {
		playlist: { show: true, value: "4D7JFKXy4daI9tUVJfGVFF" },
		song: { show: true, value: "5HU2Ddr33JPv7ZVI77M7D5" },
	},
};

export default examples;
