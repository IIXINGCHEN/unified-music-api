---
layout: home

hero:
  name: unified-music-api
  text: 统一音乐 API
  tagline: 网易云 440 · 酷狗 226 · UNM · Lyric · Meting —— 六个微服务，一个文档
  actions:
    - theme: brand
      text: API 文档
      link: /api/
    - theme: alt
      text: GitHub
      link: https://github.com/IIXINGCHEN/unified-music-api

features:
  - title: 网易云音乐
    details: 440 个接口，参数表由源码自动提取，直连 :3001
    link: /api/netease
  - title: 酷狗音乐
    details: 226 个接口，直连 :3002
    link: /api/kugou
  - title: UNM 解灰
    details: 歌曲匹配 / 直链 / 搜索 / 封面 / 歌词，直连 :3003
    link: /api/unm
  - title: 统一网关
    details: 五平台反代 /api/v1/platform/{name}/{path}，聚合接口 :8080
    link: /api/gateway
---
