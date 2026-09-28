import { defineConfig } from "vitepress";

export default defineConfig({
  lang: "zh-CN",
  title: "unified-music-api",
  description: "统一音乐 API · 官方文档",
  // GitHub Pages 项目站点路径
  base: "/unified-music-api/",
  // 构建输出到仓库 docs/（GitHub Pages 源）
  // 注意：不清空 outDir，保留 docs/ 下的项目文档（*.md）
  outDir: "../docs",
  vite: {
    build: {
      emptyOutDir: false,
    },
  },
  themeConfig: {
    logo: "/logo.svg",
    nav: [
      { text: "指南", link: "/intro/about" },
      { text: "API 文档", link: "/api/" },
      {
        text: "GitHub",
        link: "https://github.com/IIXINGCHEN/unified-music-api",
      },
    ],
    sidebar: {
      "/intro/": [
        {
          text: "介绍",
          items: [{ text: "关于", link: "/intro/about" }],
        },
      ],
      "/guide/": [
        {
          text: "指南",
          items: [
            { text: "快速开始", link: "/guide/quickstart" },
            { text: "统一路由", link: "/guide/routing" },
          ],
        },
      ],
      "/api/": [
        {
          text: "API 文档",
          items: [
            { text: "总览", link: "/api/" },
            { text: "网易云音乐", link: "/api/netease" },
            { text: "酷狗音乐", link: "/api/kugou" },
            { text: "UNM 解灰", link: "/api/unm" },
            { text: "Lyric 歌词", link: "/api/lyric" },
            { text: "Meting", link: "/api/meting" },
            { text: "网关", link: "/api/gateway" },
          ],
        },
      ],
    },
    search: { provider: "local" },
    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/IIXINGCHEN/unified-music-api",
      },
    ],
    footer: {
      message: "MIT License",
      copyright: "unified-music-api · 文档由源码自动生成",
    },
    outline: { level: [2, 3], label: "本页目录" },
    docFooter: { prev: "上一页", next: "下一页" },
    lastUpdated: { text: "更新时间" },
  },
});
