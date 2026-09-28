/**
 * P2 codemod: api-enhanced/module/*.js -> apps/netease/src/modules/*.ts
 *
 * Text-surgery based (not AST printing): removes `require` statements,
 * emits ESM imports, rewrites `module.exports =` to
 * `export default defineModule(...)`, and types the (query, request) params.
 * Comments and formatting of the module bodies are preserved verbatim.
 *
 * Usage: node scripts/codemod.mjs [--write]
 * Without --write it only reports the plan.
 */
import ts from "typescript";
import fs from "node:fs";
import path from "node:path";

const SRC = "/home/hatch/workspace/music-api-audit/repos/api-enhanced/module";
const DST = new URL("../src/modules/", import.meta.url).pathname;
const WRITE = process.argv.includes("--write");

const MANUAL = new Set([
	"login_qr_create.js", // exception: qrcode dep
	"verify_getQr.js", // qrcode dep
	"register_checktoken_v2.js", // exception: hand port
	"register_checktoken_v3.js", // exception: hand port
	"voice_upload.js", // xml2js + axios + fs + plugin DI
	"audio_match.js", // axios direct
	"cloud_upload_token.js", // axios direct
	"register_xeapikey.js", // axios direct
	"related_playlist.js", // axios direct
	"decrypt.js", // crypto-js (aesDecrypt Utf8)
	"login.js", // CryptoJS.MD5
	"login_cellphone.js", // CryptoJS.MD5
	"register_anonimous.js", // CryptoJS MD5/Base64
	"register_cellphone.js", // CryptoJS.MD5
	"user_bindingcellphone.js", // CryptoJS.MD5
	"song_url_v1.js", // unblockmusic-utils + dotenv
	"song_url_match.js", // unblockmusic-utils
]);

/**
 * Build import statements for a file.
 * specs: [{from, imported, local, isDefault}]
 */
function buildImports(specs) {
	// ncm-core framework types always come first
	specs.unshift(
		{ from: "@music-api/ncm-core", imported: "defineModule", local: "defineModule", isDefault: false },
		{ from: "@music-api/ncm-core", imported: "NcmQuery", local: "NcmQuery", isDefault: false, isType: true },
		{ from: "@music-api/ncm-core", imported: "NcmRequestFn", local: "NcmRequestFn", isDefault: false, isType: true },
	);
	const byFrom = new Map();
	for (const s of specs) {
		if (!byFrom.has(s.from)) byFrom.set(s.from, []);
		byFrom.get(s.from).push(s);
	}
	const lines = [];
	for (const [from, list] of byFrom) {
		const defs = list.filter((s) => s.isDefault);
		const named = list.filter((s) => !s.isDefault);
		const parts = [];
		if (defs.length) parts.push(defs[0].local);
		if (named.length) {
			parts.push(
				`{ ${named
					.map((s) =>
						s.imported === s.local
							? `${s.isType ? "type " : ""}${s.local}`
							: `${s.isType ? "type " : ""}${s.imported} as ${s.local}`,
					)
					.join(", ")} }`,
			);
		}
		lines.push(`import ${parts.join(", ")} from "${from}";`);
	}
	return lines;
}

/** Translate a require() into import specs. Returns null if unmappable. */
function importSpecsFor(reqPath, bindings) {
	// bindings: [{imported, local}] where imported='default' means `const x = require(...)`
	switch (reqPath) {
		case "../util/option.js":
			// module.exports = createOption  ->  named export in ncm-core
			return bindings.map((b) => ({
				from: "@music-api/ncm-core",
				imported: "createOption",
				local: b.local,
				isDefault: false,
			}));
		case "../util/index":
		case "../util/index.js":
		case "../util":
		case "../util/fileHelper":
		case "../util/ncbl":
		case "../util/config.json":
			return bindings.map((b) => ({
				from: "@music-api/ncm-core",
				imported: b.imported,
				local: b.local,
				isDefault: false,
			}));
		case "../util/crypto":
			return bindings.map((b) => ({
				from: "@music-api/ncm-crypto",
				imported: b.imported,
				local: b.local,
				isDefault: false,
			}));
		case "../util/logger":
		case "../util/logger.js":
			return bindings.map((b) => ({
				from: "../logger.js",
				imported: "logger",
				local: b.local,
				isDefault: false,
			}));
		case "../plugins/upload":
			return bindings.map((b) => ({
				from: "../plugins/upload.js",
				imported: "default",
				local: b.local,
				isDefault: true,
			}));
		case "../plugins/songUpload":
			return bindings.map((b) => ({
				from: "../plugins/songUpload.js",
				imported: "default",
				local: b.local,
				isDefault: true,
			}));
		case "fs":
			return bindings.map((b) => ({
				from: "node:fs",
				imported: "default",
				local: b.local,
				isDefault: true,
			}));
		case "../package.json":
			return bindings.map((b) => ({
				from: "../../package.json",
				imported: "default",
				local: b.local,
				isDefault: true,
			}));
		default:
			if (reqPath.startsWith("./") && reqPath.endsWith(".js")) {
				return bindings.map((b) => ({
					from: reqPath,
					imported: "default",
					local: b.local,
					isDefault: true,
				}));
			}
			return null;
	}
}

const report = { ok: [], manual: [], skipped: [], warnings: [] };

for (const file of fs.readdirSync(SRC).filter((f) => f.endsWith(".js")).sort()) {
	if (MANUAL.has(file)) {
		report.manual.push(file);
		continue;
	}
	const text = fs.readFileSync(path.join(SRC, file), "utf8");
	const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);

	const removals = []; // [start, end)
	const imports = [];
	let exportAssign = null; // {eqStart, eqEnd, arrow}
	let failed = null;

	const isRequireCall = (node) =>
		ts.isCallExpression(node) &&
		ts.isIdentifier(node.expression) &&
		node.expression.text === "require" &&
		node.arguments.length === 1 &&
		ts.isStringLiteralLike(node.arguments[0]);

	for (const stmt of sf.statements) {
		if (
			ts.isVariableStatement(stmt) &&
			stmt.declarationList.declarations.length === 1
		) {
			const decl = stmt.declarationList.declarations[0];
			if (decl.initializer && isRequireCall(decl.initializer)) {
				const reqPath = decl.initializer.arguments[0].text;
				const bindings = [];
				if (ts.isIdentifier(decl.name)) {
					bindings.push({ imported: "default", local: decl.name.text });
				} else if (ts.isObjectBindingPattern(decl.name)) {
					for (const el of decl.name.elements) {
						// BindingElement: { a } or { a: b }
						if (
							!el.propertyName &&
							ts.isIdentifier(el.name) &&
							!el.initializer
						) {
							bindings.push({ imported: el.name.text, local: el.name.text });
						} else if (
							el.propertyName &&
							ts.isIdentifier(el.propertyName) &&
							ts.isIdentifier(el.name) &&
							!el.initializer
						) {
							bindings.push({
								imported: el.propertyName.text,
								local: el.name.text,
							});
						} else {
							failed = `unsupported binding pattern in ${file}`;
						}
					}
				} else {
					failed = `unsupported declaration in ${file}`;
				}
				if (failed) break;
				const specs = importSpecsFor(reqPath, bindings);
				if (specs === null) {
					failed = `unmappable require('${reqPath}') in ${file}`;
					break;
				}
				imports.push(...specs);
				removals.push([stmt.getStart(sf), stmt.getEnd()]);
				continue;
			}
		}
		if (
			ts.isExpressionStatement(stmt) &&
			ts.isBinaryExpression(stmt.expression) &&
			stmt.expression.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
			ts.isPropertyAccessExpression(stmt.expression.left) &&
			ts.isIdentifier(stmt.expression.left.expression) &&
			stmt.expression.left.expression.text === "module" &&
			stmt.expression.left.name.text === "exports"
		) {
			const right = stmt.expression.right;
			if (!ts.isArrowFunction(right)) {
				failed = `module.exports is not an arrow function in ${file}`;
				break;
			}
			const params = right.parameters;
			if (
				params.length !== 2 ||
				!ts.isIdentifier(params[0].name) ||
				!ts.isIdentifier(params[1].name) ||
				params[0].name.text !== "query" ||
				params[1].name.text !== "request"
			) {
				failed = `unexpected params in ${file}`;
				break;
			}
			exportAssign = {
				eqStart: stmt.expression.left.getStart(sf),
				eqEnd: stmt.expression.operatorToken.getEnd(),
				arrow: right,
			};
			continue;
		}
		// Non-require top-level helpers (const maps, functions) are kept verbatim.
		if (ts.isVariableStatement(stmt) || ts.isFunctionDeclaration(stmt)) {
			continue;
		}
		failed = `unexpected top-level statement (${ts.SyntaxKind[stmt.kind]}) in ${file}`;
		break;
	}

	if (failed) {
		report.warnings.push(failed);
		report.skipped.push(file);
		continue;
	}
	if (!exportAssign) {
		report.warnings.push(`no module.exports found in ${file}`);
		report.skipped.push(file);
		continue;
	}

	// --- text surgery (apply from end to start) ---
	const arrow = exportAssign.arrow;
	const p0 = arrow.parameters[0];
	const p1 = arrow.parameters[1];
	const edits = [
		...removals.map(([s, e]) => ({ s, e, t: "" })),
		{ s: p0.getStart(sf), e: p1.getEnd(), t: "query: NcmQuery, request: NcmRequestFn" },
		{ s: arrow.getEnd(), e: arrow.getEnd(), t: ")" },
		{
			s: exportAssign.eqStart,
			e: exportAssign.eqEnd,
			t: "export default defineModule(",
		},
	];
	edits.sort((a, b) => b.s - a.s);
	let out = text;
	for (const { s, e, t } of edits) {
		out = out.slice(0, s) + t + out.slice(e);
	}
	// collapse 3+ blank lines left by removed requires
	out = out.replace(/\n{3,}/g, "\n\n");

	// cloud.js: lazy require('music-metadata') inside the function body.
	// Dynamic import keeps the lazy semantics; `.default ?? m` works with both
	// the ambient shim and the real ESM package.
	if (file === "cloud.js") {
		out = out.replace(
			"mm = require('music-metadata')",
			'mm = await import("music-metadata").then((m) => m.default ?? m);',
		);
	}

	const header = buildImports(imports).join("\n") + "\n";
	// insert after leading comment block
	const m = out.match(/^(\s*(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*)/);
	const insertAt = m ? m[0].length : 0;
	out = out.slice(0, insertAt) + header + out.slice(insertAt);

	report.ok.push(file);
	if (WRITE) {
		fs.mkdirSync(DST, { recursive: true });
		fs.writeFileSync(
			path.join(DST, file.replace(/\.js$/, ".ts")),
			out,
		);
	}
}

console.log(`auto: ${report.ok.length}, manual: ${report.manual.length}, skipped: ${report.skipped.length}`);
for (const w of report.warnings) console.log("WARN:", w);
