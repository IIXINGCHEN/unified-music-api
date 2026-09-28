// unified-music-api: lyric 服务独立运行入口
// 原项目只为 Vercel Edge 设计（export default handle(app)），
// 此处复用导出的 Hono app，通过 @hono/node-server 在普通 Node 环境提供服务。
import { serve } from '@hono/node-server';
import { app } from './api/index.ts';

const port = Number(process.env.PORT || '3000');

serve({
  fetch: app.fetch,
  port,
});

console.log(`lyric-atlas standalone listening on :${port}`);
