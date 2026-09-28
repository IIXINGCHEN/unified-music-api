// 全仓行覆盖率聚合 + 棘轮门禁。
// 用法: node scripts/check-coverage.mjs [--ratchet <pct>]
// 为每个有 test 脚本的 workspace 包跑 vitest --coverage (json)，
// 按行数加权聚合全仓行覆盖率；若低于 --ratchet 则失败（只升不降）。
// 加密包的 ≥95% 门禁由 vitest --coverage.thresholds.lines=95 直接强制，不在此脚本。
import { execSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.url.slice("file://".length), "../..");
// 从 pnpm-workspace.yaml 解析包目录（避免依赖 pnpm -r 输出格式）
const ws = readFileSync(join(root, "pnpm-workspace.yaml"), "utf8");
const pkgs = [];
for (const line of ws.split("\n")) {
  const m = line.match(/^\s*-\s*['"]?([^'"]+)['"]?\s*$/);
  if (!m || !m[1].includes("*")) continue;
  const base = m[1].replace(/\/\*$/, "");
  for (const d of [join(root, base)]) {
    // 展开一级通配符
    const { readdirSync, statSync } = await import("node:fs");
    if (!existsSync(d)) continue;
    for (const e of readdirSync(d)) {
      const full = join(d, e);
      try {
        if (statSync(full).isDirectory() && existsSync(join(full, "package.json")))
          pkgs.push(full);
      } catch {}
    }
  }
}

const args = process.argv.slice(2);
const ratchetIdx = args.indexOf("--ratchet");
const ratchet = ratchetIdx >= 0 ? Number(args[ratchetIdx + 1]) : 0;

let totalLines = 0;
let coveredLines = 0;
const perPkg = [];

for (const dir of pkgs) {
  const pkgJson = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  if (!pkgJson.scripts?.test) continue;
  const rel = dir.replace(root + "/", "");
  const outDir = join(dir, "coverage-tmp");
  try {
    execSync(
      "pnpm exec vitest run --coverage --coverage.reporter=json --coverage.reportsDirectory=./coverage-tmp",
      {
        cwd: dir,
        stdio: "pipe",
        env: { ...process.env, CI: "1" },
      }
    );
  } catch {
    // 测试失败由 test job 负责；这里只统计覆盖率，能跑多少算多少
  }
  const final = join(outDir, "coverage-final.json");
  if (!existsSync(final)) {
    perPkg.push(`${rel}: 无覆盖率数据`);
    continue;
  }
  const cov = JSON.parse(readFileSync(final, "utf8"));
  let l = 0,
    c = 0;
  for (const f of Object.values(cov)) {
    for (const counts of Object.values(f.s)) {
      l++;
      if (counts > 0) c++;
    }
  }
  totalLines += l;
  coveredLines += c;
  perPkg.push(`${rel}: ${(l ? (100 * c) / l : 0).toFixed(1)}% (${c}/${l} 行)`);
  rmSync(outDir, { recursive: true, force: true });
}

const pct = totalLines ? (100 * coveredLines) / totalLines : 0;
console.log(perPkg.join("\n"));
console.log(`\n全仓行覆盖率: ${pct.toFixed(1)}% (${coveredLines}/${totalLines} 行)`);
if (ratchet > 0) {
  if (pct < ratchet) {
    console.error(`❌ 低于棘轮基线 ${ratchet}%（只升不降），构建失败`);
    process.exit(1);
  }
  console.log(`✅ 不低于棘轮基线 ${ratchet}%`);
}
