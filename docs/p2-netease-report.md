# P2 网易云 440 模块迁移报告（v2 TS/Hono）

日期：2026-09-28　分支：`v2/rewrite`（未提交，由父代理复验后决定提交）

## 1. 模块统计

| 类别 | 数量 | 说明 |
|---|---|---|
| 模块总数 | 440 | `apps/netease/src/modules/*.ts` |
| 标准模块（contract-check） | 423 | 新旧实现请求契约逐项比对 |
| 明确例外（自有 vitest） | 3 | `login_qr_create`、`register_checktoken_v2`、`register_checktoken_v3` |
| 跳过（真实网络） | 8 | `related_playlist`、`voice_upload`、`audio_match`、`cloud_upload_token`、`register_xeapikey`、`avatar_upload`、`playlist_cover_update`、`scrobble_v1` |
| 跳过（缺失可选依赖） | 2 | `cloud`（music-metadata）、`verify_getQr`（qrcode） |
| 跳过（有意分歧） | 2 | `song_url_v1`、`song_url_match`（无 unblock 依赖时优雅降级，旧实现硬 require） |
| 跳过（旧侧缺 crypto-js/node-forge） | 2 | `decrypt`、`eapi_decrypt`（加密原语由 P1 golden vectors 覆盖，模块层为薄分发） |

## 2. Contract 检查结果

脚本：`apps/netease/scripts/contract-check.mjs`
（`NODE_PATH=/tmp/contract-harness/stubs/node_modules node scripts/contract-check.mjs`）

方法：相同 query + stubbed `request`，分别运行旧 JS 与新 TS（dist 编译产物），
比对全部 `request(path, data, options)` 调用序列；未调用 request 的模块比对返回值；
任一侧抛错则比对错误信息。确定性措施：mulberry32 重置 `Math.random`
（deviceId 生成一致，已验证新旧两次运行 deviceId 逐字相同）、冻结 `Date.now()`/
`new Date()`（消除时间戳 1ms 抖动）、crypto-js 最小 stub（MD5/Utf8.parse/Base64，
字节级验证与 node:crypto 一致）经 `NODE_PATH` 注入旧模块。

| 指标 | 结果 |
|---|---|
| 可运行 | 423 |
| 通过 | **423（100%）** |
| migration-fail | 0 |
| harness-error | 0 |
| 门禁（≥95%） | **PASS** |

triage 记录：
- 初跑 3 个 migration-fail（`vip_sign`、`ad_listening_rights_gain`、`aidj_content_rcmd`）
  均为 `Date.now()` 1ms 差异的 harness 抖动 → 冻结时间后解决，非迁移问题。
- 初跑 3 个 harness-error（`avatar_upload`、`playlist_cover_update`、`scrobble_v1`）
  均为旧实现经 `plugins/upload.js` / `util/ncbl.js` 顶层 require axios
  （审计仓库无 node_modules）→ 归入“真实网络”跳过。
  `scrobble_v1` 的 NCBL 加密逻辑已完整迁入 `ncm-core/ncbl.ts`（有 `ncbl.test.ts`）。

## 3. 失败清单

无。triage 后 migration-fail 与 harness-error 均为 0。

## 4. CryptoJS / axios 替换清单

| 原依赖 | 新实现 | 涉及模块 |
|---|---|---|
| `CryptoJS.MD5(pw).toString()` | `node:crypto createHash('md5').digest('hex')` | `login`、`login_cellphone`、`register_cellphone`、`user_bindingcellphone` |
| `CryptoJS.enc.Utf8.parse` + `MD5(wordArray)` + `Base64.stringify` | `node:crypto`（字节级等价，contract-check 覆盖 `register_anonimous`） | `register_anonimous` |
| CryptoJS AES/eapi 加解密 | `@music-api/ncm-crypto`（P1 19 条 golden vectors） | `decrypt`、`eapi_decrypt` |
| `axios.get/post` | `global fetch`（10s `AbortSignal.timeout` 语义保留） | `register_checktoken_v2`、`register_checktoken_v3`、`related_playlist`、`audio_match`、`cloud_upload_token`（lbs）、`register_xeapikey`（pubkey） |
| axios（multipart 上传） | `fetchAsAxios` 兼容层（非 2xx 即 reject，语义同 axios） | `voice_upload`（支持 `dependencies` 注入，便于测试） |
| axios（图片上传插件） | `fetch` 重写 `plugins/upload.ts` | `avatar_upload`、`playlist_cover_update`、`cloud`（经 `plugins/songUpload.ts`） |

## 5. 门禁结果

| 门禁 | 结果 |
|---|---|
| `pnpm --filter @music-api/netease build`（tsc strict） | PASS，0 errors |
| `pnpm --filter @music-api/netease lint`（biome check 446 files） | PASS，0 errors，0 warnings |
| `pnpm --filter @music-api/netease test`（vitest） | **18/18 PASS**（`test/exceptions.test.ts` 8 + `test/specials.test.ts` 10） |

vitest 覆盖：
- 例外：`login_qr_create`（qrcode mock：pc/web/qrimg 三路径）、
  `register_checktoken_v2`（jsdom 缺失优雅降级、失败不污染后续调用）、
  `register_checktoken_v3`（正常/异常响应/网络失败）。
- 特殊：`voice_upload`（分片 initiate→PUT→complete 全流程、缺文件 500）、
  `cloud_upload_token`（check→token→lbs 拼 URL、缺参 400、lbs 失败 500）、
  `song_url_v1`（无 unblock 依赖降级走正常接口、sky/vivid 分支）、
  `song_url_match`（缺依赖 500）、
  `login_qr_check`（成功 cookie join、失败路径返回空 cookie）。

## 6. 有意分歧 / 修复（非字面等价）

1. `login_qr_check`：原实现 catch 块引用 try 块级作用域的 `result` 必抛
   `ReferenceError`；新实现 hoist 后失败时返回 `{status:200, body:{}, cookie:[]}`。
   有意的错误路径修复（有 vitest 覆盖）。
2. `song_url_v1`：unblock 依赖缺失时 catch 后走正常网易接口（原实现硬 require 直接崩）。
3. `song_url_match`：unblock 依赖缺失时返回 500（原实现硬 require 直接崩）。
4. `playlist_track_all`：批量 strict 修复时曾把 `'{"id":' + item.id + '}'` 误写成
   `'{"id":}' + item.id + '}'`，已修回并经 contract-check 验证通过。
5. `scrobble_v1`：`isNaN(x)` → `Number.isNaN(x)`（x 已是 `Number()` 结果，语义一致）；
   字符串 `==` 比较在类型安全时改为 `===`，query/上游未类型化处保留 `==` + biome-ignore。

## 7. 运行时依赖缺口（需父代理补 `package.json`，本子任务禁止修改）

| 依赖 | 用途 | 缺失时行为 |
|---|---|---|
| `qrcode` | `login_qr_create`、`verify_getQr` 动态 import | 调用抛错（与原顶层 require 语义一致） |
| `jsdom` | `register_checktoken_v2` 动态 import | 返回空 token + warn（优雅降级） |
| `music-metadata` | `cloud` 动态 import | 调用抛错 |
| `@neteasecloudmusicapienhanced/unblockmusic-utils` | `song_url_v1`、`song_url_match` 动态 import | v1 降级走正常接口 / match 返回 500 |
| `@types/node`（dev） | 替代 `src/node-shims.d.ts` 临时垫片 | 垫片现为临时方案，安装后删除 |
| `undici` | `ncm-core` 正式 HTTP(S) 代理支持（P1 遗留） | 代理缺依赖时 fail-closed |

## 8. 后续（P3 前置）

- `song_url_v1_302` 在 P3 app 层必须转为真实 HTTP 302 + `Location`。
- 酷狗 228 模块迁移尚未开始，不得宣称 P2 完成。
