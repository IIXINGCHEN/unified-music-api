# unified-music-api v2 PRD —— TS/Hono 全面重构

| 项 | 内容 |
|---|---|
| 版本 | v1.0 |
| 日期 | 2026-09-28 |
| 状态 | 技术栈已冻结（TS/Hono），用户已 CONFIRM 全量重写（方案 3） |
| 分支 | `v2/rewrite`（`main` 保留 v1 聚合版作为回滚基线） |
| 源码基线 | `~/workspace/music-api-audit/repos/` 下 9 个原始仓库（只读引用） |

---

## 1. 背景与目标

### 1.1 背景

v1（`main` 分支）采用"原样迁入 + Go 网关聚合"策略：5 个服务业务代码零改写。经全树 diff 验证功能完整一致，但未满足"全部使用新的技术栈来全面重构"的要求——仓库内并存 Go + Node + TS 三种技术栈，网易云/酷狗服务仍是 Express 时代架构。

### 1.2 目标

1. **单技术栈**：全仓库统一为 TypeScript（strict）+ Hono，Node 22 运行时，pnpm monorepo。消除 Go/Node/TS 三栈并存。
2. **功能零丢失**：网易云 440 接口、酷狗 226 路由、UNM、歌词链、Meting（spotify/ytmusic）、网关全部能力逐项复制，行为一致（路径、参数、Cookie、状态码、响应结构、特殊行为）。
3. **去除冗余**：Go 网关中过度设计的插件框架（零实现的 FilterPlugin/CachePlugin、从未启用的热加载）不再复制；各服务自研的 apicache/限流/日志收敛到共享包。
4. **可验证**：加密核心 golden-vector 门禁 + 抽样差分测试，每期有明确验收标准（DoD）。

### 1.3 非目标（Out of Scope）

- 不新增任何业务接口（440+226 之外不加新端点）。
- 不改变上游调用目标（仍调 music.163.com / kugou 网关等官方上游）。
- 不做 GitHub 建仓 / push / 生产部署（需单独 CONFIRM）。
- 不删除 3 个已退役旧仓库（需双重 DELETE，本 PRD 不覆盖）。
- 不引入 Redis/外部中间件：保持与原实现一致的进程内缓存/限流语义。

---

## 2. 技术栈（冻结）

| 层 | 选型 | 说明 |
|---|---|---|
| 语言 | TypeScript 5.8（strict） | 离原 JS 最近，codemod 风险最低 |
| 运行时 | Node.js 22 LTS | 原生 `node:crypto`、`zlib`、`FormData`、`fetch` 可替代 crypto-js/pako/form-data/axios |
| Web 框架 | Hono 4 | unm/lyric/meting 本就使用，已验证 |
| 包管理/构建 | pnpm 10 workspaces + Turborepo 2 | 与 kk-quote-v3 工程规范一致 |
| 校验/契约 | Zod 3 + @hono/zod-openapi | 统一 OpenAPI 注册表 |
| 文档 | Scalar | 与 v1 `docs/api.html` 体验一致 |
| 测试 | Vitest 3 | 单元 + golden-vector + 差分 |
| 规范 | Biome 2 | lint + format + import 整理 |
| 容器 | Docker（node:22-slim 多阶段构建） | 每服务独立镜像，compose 编排 |

**冻结声明**：以上选型在 P6 之前不变更；任何变更需修订本 PRD 并经用户确认。

---

## 3. 总体架构

### 3.1 Monorepo 布局

```
apps/
  gateway/    Hono 网关：路由 / 鉴权 / 限流 / 平台反代 / 健康 / 配置 API
  netease/    Hono：440 模块（src/modules/*.ts，codemod 生成 + 手工例外）
  kugou/      Hono：226 路由（src/modules/*.ts，codemod 生成 + 手工例外）
  unm/        Hono：已有 TS 源码迁入
  lyric/      Hono：已有 TS 源码迁入
  meting/     Hono：JS→TS（仅 spotify/ytmusic provider）
packages/
  ncm-crypto/     网易加密：weapi / eapi / linuxapi / xeapi + 响应解密（手写移植）
  ncm-core/       网易核心：createRequest / cookie / 模块框架 defineModule（手写移植）
  kugou-crypto/   酷狗签名：7 种 signer + AES/RSA + KRC 解码（手写移植）
  kugou-core/     酷狗核心：createRequest / 设备指纹 / 模块框架（手写移植）
  http-kit/       共享：2 分钟缓存 / 滑动窗口限流 / 日志 / 错误信封
  contracts/      OpenAPI 注册表 + 共享 Zod schema
deploy/docker-compose.yml
docs/PRD.md（本文件）  docs/api.html（Scalar，由 contracts 生成）
scripts/assert.sh（P5/P6 断言）
```

### 3.2 运行时拓扑与端口（与 v1 compose 保持一致）

| 服务 | 容器内端口 | 环境变量（上游地址） |
|---|---|---|
| gateway | 5678（宿主映射 8080） | `PLATFORM_NETEASE_URL=http://netease:3001` 等 5 个 |
| netease | 3001 | — |
| kugou | 3002 | `KUGOU_API_PROXY`（可选） |
| unm | 3003 | — |
| lyric | 3004 | `EXTERNAL_NCM_API_URL=http://netease:3001/lyric`（回退链） |
| meting | 3005 | `SPOTIFY_API` / `YT_API`（上游，二者缺失时对应能力失败，属原行为） |

### 3.3 请求流

```
Client → gateway:5678 ─┬─ /api/v1/match|search|...        （网关原生能力）
                        ├─ /api/v1/platform/netease/*  → netease:3001/*
                        ├─ /api/v1/platform/kugou/*   → kugou:3002/*
                        ├─ /api/v1/platform/unm|lyric|meting/* → 对应服务
                        ├─ /api/v1/system/* /config/*  （鉴权区）
                        └─ /health /ready /metrics /healthz...（免认证探针）
```

---

## 4. 功能需求

### 4.1 apps/gateway（Go/Gin → Hono 重写）

源基线：`gateway/`（18847 行 Go），真实行为面约 3500–4000 行等价逻辑。

#### FR-GW-01 路由（必须逐项复制）

| 分组 | 方法 | 路径 | 行为要求 |
|---|---|---|---|
| 音乐（公开） | GET | `/api/v1/match?id=&server=` | 按 ID 匹配播放链接，多音源回退 |
| | GET | `/api/v1/ncmget?id=&br=` | 网易云直链 |
| | GET | `/api/v1/other?name=` | 其他音源按歌名获取 |
| | GET | `/api/v1/search?keyword=&sources=&limit=` | limit 默认 20，上限 100（超限截断/400？以原行为为准，P4 逐项核对） |
| | GET | `/api/v1/info?source=&id=` | 音乐详情 |
| | GET | `/api/v1/picture?source=&id=&size=` | 仅 `source=gdstudio`，size 仅允许 300/500 |
| | GET | `/api/v1/lyric?source=&id=` | 仅 `source=gdstudio`，返回 `{lyric, tlyric}` |
| 平台聚合（公开） | ANY | `/api/v1/platform/:name/*path` | 反代 5 平台；未知平台 404（文案含可用平台列表）；上游失败 502 `{code:502, message:"平台服务不可用: <name>", platform}`；透传 query + User-Agent |
| 系统（需 API Key） | GET | `/api/v1/system/info\|health\|metrics\|sources` | metrics 为 JSON 信封内指标对象（非 Prometheus 文本格式，保持原样） |
| | POST | `/api/v1/system/sources/refresh` | 刷新音源 |
| | GET/POST | `/api/v1/system/cache/stats\|clear` | 缓存统计/清空 |
| | GET | `/api/v1/version`, `/ping` | |
| 配置（读需 API Key，写需 Admin Key） | GET/PUT | `/api/v1/config`, `/api/v1/config/:section` | 读返回脱敏配置 |
| | POST | `/api/v1/config/validate\|reload\|backup` | |
| | GET | `/api/v1/config/backups` | |
| | POST/DELETE | `/api/v1/config/backup/:id/restore`, `/api/v1/config/backup/:id` | |
| 健康（免认证） | GET | `/health`, `/ready`, `/metrics`, `/healthz`, `/readyz`, `/startupz` | K8s 探针兼容 |
| 根 | GET | `/`, `/api`, `/api/v1` | 安全开启时隐藏管理端点 |
| 静态 | GET | `/public/*` | 文件服务 |
| 兜底 | — | 404 → `{code:404,message:"接口不存在"}`；405 → `{code:405,message:"方法不允许"}` | |

#### FR-GW-02 中间件（按 Order 执行）

1. recovery：panic 捕获 → 500 信封 + 日志。
2. cors：Origin 白名单命中则回显 Origin，否则 `*`；`Allow-Credentials: true`，Max-Age 可配。
3. logging：method/path/status/latency/clientIP，可配置跳过路径。
4. APIKeyAuth（system/config 组，安全开关开启时）：RequireHTTPS→426 → UA 白名单→403 → IP 白名单（精确/CIDR/起止/`*`，命中直通）→ 按 IP 滑动窗口限流→429（文案"请求过于频繁，请稍后再试"）→ 取 Key（优先级 `X-API-Key` > `Authorization: Bearer/ApiKey` > `X-Auth-Token` > query `api_key`）→ 常量时间比较→401 → 审计日志。
5. AdminAuth（config 写操作）：强制 HTTPS→426 → 白名单 → Key 比较→401。**注意：原 Go 版每次请求新建限流器导致管理限流实际不生效，此为 bug，Hono 版必须使用共享限流器真正生效，并在 CHANGELOG 注明行为变更。**

#### FR-GW-03 响应信封

全网关统一 `{code, message, data}`；成功 code=200，HTTP 状态码与业务 code 一致。错误文本→状态码映射保留原字符串匹配逻辑（"参数"→400、"限流"→429、"未找到"→404）。

#### FR-GW-04 配置体系

- 分层 YAML：`config.yaml` → `configs/environments/{development|staging|production}.yaml`，按 `NODE_ENV`（原 `GO_ENV`）选择叠加；`setDefaults` 补默认值；启动时 `ValidateConfig` 校验。
- 24 个同名环境变量覆盖（原 19 个 + 5 个 `PLATFORM_*_URL`），名称保持不变（`GO_ENV` 除外，改为 `NODE_ENV`）。
- **不复制**：热加载 Watcher（原代码从未启用）、插件框架（Registry/Manager/事件总线/init 自动注册 → 改为普通模块函数组合；`FilterPlugin`/`CachePlugin` 原本零实现，直接 drop）。

#### FR-GW-05 状态与语义

- 内存缓存 + MusicInfoCache（TTL、后台清理、统计/清空 API），**进程内语义**：多实例不共享，**不引入 Redis**（与 Go 版一致才是"一致"）。
- 限流器内存实现（滑动窗口 + TokenBucket，按原调用位置保留）。
- 优雅关闭（SIGINT/SIGTERM，30s draining）；TLS 可选。
- 健康检查器注册表（Basic/Memory 阈值/ExternalService）+ uptime。
- 日志：pino 结构化（替代 zap），字段对齐。

### 4.2 apps/netease（api-enhanced → TS/Hono）

源基线：`api-enhanced`（440 模块 + `util/` 2802 行 + `server.js`）。

#### FR-NCM-01 路由注册

- 扫描 `src/modules/*.ts`，文件名 `_` → `/`（如 `album_new.ts` → `/album/new`），`app.all()` 注册（所有 HTTP 方法接受）。
- 3 个特例保留下划线：`/daily_signin`、`/fm_trash`、`/personal_fm`。
- 模块签名统一为 `defineModule((query, request) => …)`，其中 `query: NcmQuery`（`Record<string, any>` + 保留字段显式声明，**不**逐个推导业务类型），`request` 为 `ncm-core` 的 `createRequest`。

#### FR-NCM-02 请求处理链（与 server.js 逐项对齐）

1. CORS：仅非 `/` 且无扩展名路径；`CORS_ALLOW_ORIGIN` 白名单命中则回显，否则回显 Origin；OPTIONS 直接 204。
2. Cookie 解析：自研（逐 `;` 分割 + 安全解码），结果为对象。
3. Body：JSON + urlencoded 上限 **500MB**；文件上传（`avatar_upload` 等）走 multipart，临时文件落盘 `os.tmpdir()`。
4. 缓存：`http-kit` 的 2 分钟缓存中间件，仅 `statusCode===200` 缓存。
5. 参数合并：`Object.assign({}, {cookie}, query, body, files)` —— **files 混入 query 的约定必须保留**（上传模块依赖）。
6. `query.cookie` / `body.cookie` 为字符串时先转对象。
7. IP 注入：`randomCNIP` → 全局中国 IP；否则取客户端 IP（剥 `::ffff:` 前缀；`::1` 回退中国 IP）；注入 `X-Real-IP` / `X-Forwarded-For`。
8. 特殊逻辑：`/song/url/v1` + `ENABLE_GENERAL_UNBLOCK=true` → 自动解灰（`@neteasecloudmusicapienhanced/unblockmusic-utils`，依赖保留）；kuwo URL + `ENABLE_PROXY` → 拼接代理前缀。

#### FR-NCM-03 响应与错误

- `cookie[]` → `Set-Cookie`（`noCookie` 参数跳过；HTTPS 追加 `SameSite=None; Secure`）。
- `redirectUrl` → **302 重定向**（唯一使用者 `song_url_v1_302`）。
- `res.status(status).send(body)` 原样回写。
- 模块 reject 时：`body.code=='301'` → msg 改写"需要登录"；无 body → 404 `{code:404,msg:'Not Found'}`；否则原样回写 status+body。

#### FR-NCM-04 加密（packages/ncm-crypto，手写移植，P1 门禁）

| 函数 | 算法 | 使用量 |
|---|---|---|
| `weapi` | AES-128-CBC 双层（presetKey/iv → 随机 base62 密钥）+ RSA（node-forge NONE padding）→ `{params, encSecKey}` | 217 模块 |
| `eapi` | `nobody{url}use{text}md5forencrypt` 取 MD5 → AES-128-ECB hex → `{params}` | 35 模块 + **默认** |
| `linuxapi` | AES-128-ECB，key `rFgB&h#%2?^eDg:Q`，hex 大写 | 仅 `decrypt` 调试模块 |
| `xeapi` | X25519 ECDH 派生 AES-128-GCM 加密动态密钥 + AES-ECB 双层 + XOR 混淆 + base64 旋转 → `{B, S, R}` | 6 模块 |
| `decrypt` / `eapiResDecrypt` / `eapiReqDecrypt` / `xeapiResDecrypt` / `xeapiSign` / `xeapiDecryptPublicKey` / `aesEncrypt` / `aesDecrypt` | 见源 `util/crypto.js`（321 行） | 响应解密链 |

- 默认加密：`APP_CONF.encrypt=true`（config.json）→ crypto 为空时走 **eapi**。
- `createRequest`（源 `util/request.js` 518 行）行为：5 种加密分支；cookie 自动补 `__remember_me`/`_ntes_nuid`/`WNMCID`/`NMTID`（eapi 探测）、无 MUSIC_U 补匿名 token；UA 按 crypto+os 选择；proxy 支持 pac/隧道；`checkToken: v2/v3` → 易盾 token 加 `X-antiCheatToken` 头；eapi/weapi 响应 `arraybuffer` + 解密；`SPECIAL_STATUS_CODES={201,302,400,502,800,801,802,803}` → HTTP 200（业务码在 body.code）；`body.code` 强制 Number；非 200 reject；网络异常 → 502。
- **解耦要求**：原 `request.js` 在加载期同步读 `os.tmpdir()/anonymous_token` 与 `xeapi_public_key`（缺失即崩）且与 `register_checktoken_v2/v3` 循环依赖。Hono 版必须改为依赖注入/懒加载，**不允许复制加载期崩溃行为**（改为启动时明确报错或降级，二选一在 P1 确定）。
- `global.cnIp` / `global.deviceId` 跨模块全局状态 → 收敛为 `ncm-core` 的单例状态模块。

#### FR-NCM-05 例外模块（codemod 不覆盖，人工移植）

1. `login_qr_create`：`(query)` 单参数，纯本地 QR 逻辑。
2. `register_checktoken_v2` / `v3`：导出 `getToken()`（易盾 Watchman，jsdom 环境 → Hono 版用 Node 侧等价实现，P1 验证可行性）。
3. `voice_upload`：唯一 3 参 `(query, request, dependencies)`，multipart + xml2js。
4. `song_url_v1`：模块级 `dotenv.config()` 副作用 → 移到应用启动期。
5. `login`：手动 MD5、502 改写文案。
6. 上传三件套（`avatar_upload` / `playlist_cover_update` / `voice_upload`）走 `plugins/upload.js` 等价实现。

codemod 覆盖 437/440 标准模块（薄包装，平均 15–25 行）。

---

### 4.3 apps/kugou（KuGouMusicApi → TS/Hono）

源基线：`KuGouMusicApi`（228 文件，226 公开路由 + 2 内部辅助 + `util/` 2983 行）。

#### FR-KG-01 路由注册

- 扫描 `src/modules/*.ts`，过滤 `_` 开头文件（`_comment`、`_listen_together_common` 为内部辅助，不注册）；文件名 `_` → `/`；倒序排列；`app.all()` 挂载（原 `app.use` 语义 = 所有方法共用 handler）。
- 公开路由数 **226**（"228 模块"含 2 个内部文件，PRD 以 226 为准）。

#### FR-KG-02 请求处理链

1. query/body 的 `cookie` 字符串字段 → 解析合并；`Authorization` 头按 cookie 格式解析并入。
2. 设备标识注入（客户端未提供时）：`KUGOU_API_PLATFORM` / `MID` / `GUID=MD5(UUIDv4)` / `DEV=启动时随机10位大写` / `MAC=02:00:00:00:00:00` / `WEBGL`，并写回 Set-Cookie。
3. CORS：`ACAC=true`、`ACAO=CORS_ALLOW_ORIGIN||origin||'*'`、允许头 `Authorization,X-Requested-With,Content-Type,Cache-Control`；OPTIONS 204。
4. 缓存：2 分钟，仅 200；`timestamp` 参数绕过。
5. Body 上限：json 16MB / urlencoded 5MB / `octet-stream` 100MB → **包成 `{data: Buffer}` 传给模块（约定保留）**。
6. 响应：`cookie[]` → Set-Cookie（HTTPS 加 `SameSite=None; Secure`；`noCookie` 禁用）；异常无 body → 404 `{code:404,data:null,msg:'Not Found'}`。

#### FR-KG-03 签名与加密（packages/kugou-crypto，手写移植，P1 门禁）

| 签名 | 盐 | 规则 | 使用量 |
|---|---|---|---|
| android | `OIlwieks28dk2k092lksi2UIkp`（lite 版 `LnT6xpN3khm36zse0QzvmgTZ3waWdRSA`） | 按 key 字母排序 `key=value` 拼接；对象值先 stringify；**Buffer body 走增量 MD5** | 187 模块 |
| web | `NVPh5oo715z5DIWAeQlhMDsWXXQV4hwt` | **先拼 `key=value` 再对整串排序**（与 android 语义不同！） | 5 模块 |
| signParams | `R6snCXJgbCaj9WFRJKefTMIFp0ey6Gza` | `key+value`（无等号）排序拼接 + body | — |
| signKey | `57ae12eb6890223e355ccfcb74edf70d` | `MD5(hash+盐+appid+mid+userid)` | encryptKey 选项 |
| signParamsKey | — | `MD5(appid+盐+clientver+data)` | — |
| signCloudKey | — | `MD5("musicclound"+hash+pid+盐)` | 云歌单 |
| register | `1014` | 只取**值**排序（module 中零使用，**死代码不移植**） | 0 |

- `createRequest`（源 `util/request.js` 410 行）：默认注入 `dfid/mid/uuid/appid/clientver/clienttime`（+`token/userid`）；固定头 `kg-rc/kg-thash/kg-rec/kg-rf` + UA `Android15-1070-11083-46-0-DiscoveryDRADProtocol-wifi`；`X-Real-IP`/`X-Forwarded-For`；`KUGOU_API_PROXY`；openapicdn 域名参数拼 URL；响应头 `ssa-code` → 自动 `generateSimulate` 附加 `edt/sid`；上游 `status=0` 或 `error_code!=0` 判失败 → **成功 resolve(200)，失败 reject(502)**。
- 加密通道（仅特定模块）：`createCloudRequest`（RSA-PKCS1 加密会话串 + AES-CBC，key/iv 由 MD5(随机6字符) 推导）、`playlistAesEncrypt`、`generate_simulate`（EDT=AES-128-CBC，SID=RSA-OAEP-SHA256）。
- KRC 歌词解码：XOR 16 字节密钥 + inflate（`node:zlib` 替代 pako）。
- `calculateMid`：MD5→hex→大整数转十进制（原生 BigInt 替代 big-integer）。
- Node 侧 `generateWebGLHash` 走随机 uint64（与原 Node 分支一致）。

#### FR-KG-04 例外模块（人工移植）

1. `user_cloud_upload`（326 行）：直引 axios 的 5 步 BSS 分片上传 + 秒传分支，调用兄弟模块 `user_cloud_match`，options（`clearDefaultParams`+`notSignature`）保留。
2. `user_update_avatar`：form-data 两步（multipart 传图床 → 调 `user_update` 落库），原生 FormData 替代。
3. 6 个 `qrcode` 模块：纯本地构造响应。
4. 5 个 `createDomainHandler` 模块（`listen_together_*`）：按 `operation` 分发。
5. `comment_floor`：具名函数 + 附加命名导出。
6. 模块间 require（`user_cloud_match`、`user_update`、`verify_user_info`）→ 改为 ESM import，注意循环依赖。
7. `main.js` 程序化入口：226 个扁平函数导出（`api.search(params)`），cookie 字符串自动转对象 —— **Hono 版保留该入口**（`src/main.ts`），供 SDK 式调用。

codemod 覆盖 207/228 标准模块；146 个 <30 行纯声明式模块为甜点区。

### 4.4 apps/unm（unm-music-api → 迁入）

源基线已是 TS/Hono，**迁入为主、最小改动**。

- FR-UNM-01：保留全部现有路由（`/match`、`/ncmget`、`/otherget`、`/test`，P4 实施时以源码为准逐项核对）。
- FR-UNM-02：多源匹配与解灰逻辑原样迁移；GDStudio/UNM 上游地址走环境变量。
- FR-UNM-03：日志/错误处理收敛到 `http-kit`（行为不变，仅换实现）。

### 4.5 apps/lyric（Lyric-Atlas-API → 迁入）

- FR-LY-01：TTML → yrc / lrc / eslrc 转换链原样迁移。
- FR-LY-02：回退链保留：本地转换失败 → `EXTERNAL_NCM_API_URL`（compose 中指向网易云服务 `/lyric`）。
- FR-LY-03：`server.ts` 独立入口保留（v1 已验证）。

### 4.6 apps/meting（Meting-API → JS 转 TS）

- FR-MT-01：仅保留 `spotify` / `ytmusic` provider（v1 已精简，`netease`/`tencent` 由原生服务覆盖，不恢复）。
- FR-MT-02：`SPOTIFY_API` / `YT_API` 环境变量语义不变；未配置时对应能力失败（原行为，不新增降级）。
- FR-MT-03：JS→TS 转换，默认源 `spotify` 保持。

### 4.7 packages（共享包职责）

| 包 | 职责 | 移植方式 |
|---|---|---|
| ncm-crypto | §4.2 FR-NCM-04 | 手写 + golden-vector |
| ncm-core | createRequest、cookie 工具、defineModule 框架、全局状态单例 | 手写 |
| kugou-crypto | §4.3 FR-KG-03 | 手写 + golden-vector |
| kugou-core | createRequest、设备指纹、模块框架 | 手写 |
| http-kit | 2 分钟 apicache（内存+TTL+后台清理）、滑动窗口限流、请求日志、统一错误信封 | 新写（行为对齐原 apicache/memory-cache） |
| contracts | OpenAPI 注册表（@hono/zod-openapi）、共享 Zod schema、Scalar 文档生成 | 新写 |

---

## 5. 兼容性契约（验收总纲）

任何 v2 响应与 v1（= 原始仓库行为）在以下维度不一致即为缺陷：

| # | 维度 | 契约 |
|---|---|---|
| C-01 | 路由路径 | 网易云 `_`→`/`（3 特例除外）；酷狗 `_`→`/`（`_` 开头不注册）；网关路由表见 FR-GW-01 |
| C-02 | HTTP 方法 | 网易云/酷狗模块接受**所有方法**（`app.all`）；网关按 FR-GW-01 表格 |
| C-03 | 参数合并 | 网易云：`{cookie} + query + body + files`（后者覆盖前者）；酷狗：query/body cookie 字符串并入 + Authorization 头并入 |
| C-04 | Cookie | 请求：字符串 cookie 自动转对象；响应：`cookie[]` → Set-Cookie，HTTPS 追加 `SameSite=None; Secure`，`noCookie` 可跳过 |
| C-05 | 状态码 | 网易云 SPECIAL_STATUS_CODES → 200；上游网络异常 → 502；无 body 异常 → 404；网关 404/405 兜底文案一字不差 |
| C-06 | 响应结构 | 网易云/酷狗：`res.status(status).send(body)` 原样透传（body.code 强制 Number）；网关：`{code,message,data}` 信封 |
| C-07 | 错误文案 | 网易云 `code==301` → "需要登录"；网关 429 → "请求过于频繁，请稍后再试"；平台反代 502 → `"平台服务不可用: <name>"` |
| C-08 | 特殊行为 | redirectUrl→302；apicache 2 分钟（仅 200，酷狗 `timestamp` 可绕过）；网易云 500MB body / 酷狗 16MB+5MB+100MB(`{data:Buffer}`)；IP 注入规则 |
| C-09 | 加密默认 | 网易云 crypto 为空 → eapi（`APP_CONF.encrypt=true`）；酷狗默认 android 签名 |
| C-10 | 环境变量 | 全部沿用原名（网关 `GO_ENV`→`NODE_ENV` 除外，见 FR-GW-04） |

---

## 6. 非功能需求

### 6.1 性能

- NFR-P-01：单实例吞吐不低于 v1（Node 22 直连，无额外代理层；网关反代保持透传）。
- NFR-P-02：apicache 命中时 p99 < 50ms（本地）。
- NFR-P-03：内存缓存/限流后台清理间隔 ≤ 60s，避免无界增长。

### 6.2 安全

- NFR-S-01：API Key 常量时间比较；配置读取接口脱敏（敏感字段 `***`）。
- NFR-S-02：Admin 写操作强制 HTTPS（426），与原行为一致。
- NFR-S-03：`pnpm audit` 高危漏洞门禁；gitleaks 扫描（密钥不进仓库，酷狗 config.json 中的敏感值走环境变量）。
- NFR-S-04：文件上传临时目录定期清理，防止磁盘打满。

### 6.3 可观测性

- NFR-O-01：结构化日志（pino），字段对齐原 zap（method/path/status/latency/clientIP）。
- NFR-O-02：`/metrics` 保持 JSON 指标对象（与原格式一致；Prometheus 文本格式**不在本期范围**）。
- NFR-O-03：健康探针 6 路径 + `/api/v1/system/health` 结构不变。

### 6.4 部署

- NFR-D-01：`deploy/docker-compose.yml` 一键起 6 服务，端口/环境变量见 §3.2。
- NFR-D-02：`deploy/Dockerfile` 为单一参数化多阶段 Dockerfile（`--build-arg APP/PKG/PORT/ENTRY`），
  覆盖 6 个服务（node:22-slim，`pnpm --filter` 构建）。以一份 Dockerfile 表达 6 服务构建，
  避免 6 份近乎相同的 Dockerfile 冗余；原"每服务独立 Dockerfile"条文作废。
- NFR-D-03：CI：lint（biome）→ typecheck（tsc）→ test（vitest，含 golden-vector）→ build，全绿才合入。

### 6.5 企业开发规范（硬门禁）

- 提交信息走 commitlint（conventional commits）；分支保护（禁止直推 main）。
- 覆盖率阈值：`ncm-crypto` / `kugou-crypto` 行覆盖 ≥ 95%（golden-vector 天然高覆盖，实测 100%，CI 硬门禁）；
  全仓 ≥ 70% 为目标（apps 层多为模块薄包装器，2026-09-28 实测基线 33.1%；
  CI 用 `scripts/check-coverage.mjs` 强制棘轮基线 30% 只升不降，持续补测试向 70% 收敛）。
- SemVer + CHANGELOG（记录 AdminAuth 限流 bug 修复等行为变更）。
- 发版审批与审计日志：沿用现有规范（本 PRD 不新增流程）。

---

## 7. 实施分期与验收（DoD）

| 期 | 内容 | 验收标准（DoD） |
|---|---|---|
| P0 ✅ | Monorepo 骨架：pnpm+turbo+tsconfig+biome，6 apps + 6 packages | `pnpm build` 12/12 通过（已完成，`a2f0a57`） |
| P1 | 加密核心手写移植：`ncm-crypto`（weapi/eapi/linuxapi/xeapi+解密链）、`kugou-crypto`（7 signer+AES/RSA+KRC）；**golden-vector 门禁**：用原始 JS 跑出固定输入→输出向量，TS 版逐字节断言 | golden 用例 100% 通过；行覆盖 ≥95%；`register_checktoken` jsdom 可行性结论 |
| P2 | codemod 机械转换：网易云 437 + 酷狗 207 标准模块；§4.2/4.3 例外清单人工移植 | 全部模块可加载（无 import/循环依赖异常）；`tsc` 全绿；模块数 440/226 对上 |
| P3 | 服务端行为移植：请求链（FR-NCM-02/FR-KG-02）、响应/错误（FR-NCM-03/FR-KG-02.6）、缓存/上传/重定向 | §5 兼容性契约 C-01~C-10 逐项对照通过（对照表入 `docs/parity.md`） |
| P4 | unm/lyric 迁入；meting JS→TS；网关 Hono 重写（FR-GW-01~05） | 网关路由清单 diff 为零（除已声明的 AdminAuth 限流修复）；`main.js` 扁平入口可用 |
| P5 | contracts OpenAPI + Scalar `docs/api.html`；compose；CI；`scripts/assert.sh`（≥40 项断言，覆盖 C-01~C-10） | assert.sh 全绿；CI 全绿 |
| P6 | 差分测试：抽样 ≥30 个真实接口（覆盖 weapi/eapi/xeapi、android/web 签名、上传、二维码、登录态），新旧响应结构对比 | 结构差异清零或逐项解释；PRD 修订为 v1.1（如有行为澄清） |

**门禁规则**：上期 DoD 未达成，不进下期。P1 是全项目的最高风险门禁。

## 8. 风险登记

| # | 风险 | 概率 | 影响 | 对策 |
|---|---|---|---|---|
| R-01 | 加密字节级偏差（RSA NONE padding、xeapi 手工混淆、MD5 拼接细节） | 中 | 高（静默失败，上游 502/风控） | P1 golden-vector 门禁；P1 不过不进 P2 |
| R-02 | 网易云 request.js 循环依赖 + 加载期同步读文件 | 高 | 高（启动崩溃/时序错乱） | 改为依赖注入/懒加载；启动期显式校验 |
| R-03 | 酷狗 web 签名"先拼串后排序"被误写成按键排序 | 中 | 高（签名全错） | golden 向量锁定 7 种 signer |
| R-04 | query 隐式契约（保留字段 vs 业务字段混用） | 高 | 中 | `Record<string,any>` + 保留字段显式声明；不逐个推导类型 |
| R-05 | `express.raw` → Hono 二进制语义漂移（`{data: Buffer}` 约定） | 中 | 高 | P3 专项对照；上传模块端到端测试 |
| R-06 | 上游（网易云/酷狗）接口漂移 | 低 | 中 | 差分测试抽样；上线前灰度；本 PRD 不承诺 100% 上游覆盖 |
| R-07 | 易盾 checktoken（jsdom Watchman）在纯 Node/Hono 下不可行 | 中 | 中 | P1 出可行性结论；不行则该能力标记为"受限"并记录 |
| R-08 | 工期：668 模块 + 网关重写体量大 | 高 | 中 | codemod 吃掉 90% 机械量；分期交付，每期独立可验收 |

## 9. 回滚方案

1. **分支级回滚**：重写全部在 `v2/rewrite` 分支；任何时候删除该分支即回到 v1（`main` 聚合版，可直接部署），零成本。
2. **基线保留**：`~/workspace/music-api-audit/repos/` 9 个原始仓库只读保留，作为行为仲裁源。
3. **不触碰项**：无远程操作（不建仓/不 push/不部署），回滚不涉及任何外部系统。
4. **叫停**：用户在任何时间点说停，当前期工作提交为 WIP commit 后冻结。

## 10. 术语表

| 术语 | 含义 |
|---|---|
| weapi/eapi/linuxapi/xeapi | 网易云四种请求加密方式（见 FR-NCM-04） |
| golden-vector | 用原始实现跑出的固定输入→输出断言向量，移植正确性的硬门禁 |
| codemod | 机械代码转换脚本（本项目：JS 模块 → TS `defineModule`） |
| apicache | 原服务中的 2 分钟响应缓存中间件（仅缓存 200） |
| SPECIAL_STATUS_CODES | 网易云强制转 HTTP 200 的业务码集合 |
| 解灰（unblock） | 播放灰色（无版权）歌曲时自动寻找可播放音源 |
| dfid/mid/guid | 酷狗设备指纹三件套 |

## 11. 附录

- A. 侦察报告原文：网易云 / 酷狗 / 网关三份只读评估（2026-09-28，见会话记录）。
- B. v1 交付基线：`main` 分支 `7c78c25`，assert.sh 29/29。
- C. 审计基线：`~/workspace/music-api-audit/AUDIT.md`。
- D. 待 P3 输出：`docs/parity.md`（C-01~C-10 逐项对照表）。
- E. 待 P5 输出：`contracts/openapi.yaml`、`docs/api.html`、`scripts/assert.sh`。

---

*本 PRD 为 v2 重写的唯一需求基准；实现与 PRD 冲突时，以 PRD 为准并修订 PRD。*
