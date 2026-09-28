/**
 * /test demo page — port of src/template.js.
 * Renders APlayer demo blocks for the ported providers only.
 */
import type { Context } from "hono";
import examples from "./example.js";

let html = `
<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>测试页面</title>
    <link rel="stylesheet" href="https://unpkg.com/aplayer/dist/APlayer.min.css">
</head>

<body>
    <script src="https://unpkg.com/aplayer/dist/APlayer.min.js"></script>
    <script>
        var meting_api = 'api?server=:server&type=:type&id=:id&auth=:auth&r=:r';
    </script>
    <script src="https://unpkg.com/@xizeyoupan/meting@latest/dist/Meting.min.js"></script>
`;

for (const provider of Object.keys(examples)) {
	for (const type of Object.keys(examples[provider])) {
		if (!examples[provider][type].show) continue;

		html += `
    <div>
        <p>${provider} ${type}</p>
        <meting-js server="${provider}" type="${type}" id="${examples[provider][type].value}" list-folded=true />
    </div>
    <br/>
`;
	}
}

html += `
</body>

</html>
`;

export const handler = (c: Context): Response => {
	return c.html(html);
};
