# Milo 配置参考

[使用指南](README.md) · [English](../en/configuration.md)

## 站点配置

修改 Hexo 站点根目录的 `_config.yml`。除 Milo 的默认语言外，下表默认值来自 Hexo 8.1.2 和对应生成器。建站模板可设置自己的值。

| 字段 | 类型 | 默认值 | 实际作用 |
| --- | --- | --- | --- |
| `title` | 字符串 | `Hexo` | 导航、分享及订阅使用的站名。 |
| `author` | 字符串 | `John Doe` | 作者卡片、关于页和页脚的作者。 |
| `description` | 字符串 | `""` | 站点描述，缺失时回退到简介和站名。 |
| `language` | 字符串 / 列表 | `zh-CN (Milo)` | zh-CN 或 en，支持 en-US 和 zh-Hans 等别名。未设时用简体，指定语言均不支持时用英文。 |
| `theme` | 字符串 | `landscape` | 设为 milo 启用。目录安装优先于 npm。 |
| `url` | 字符串 | `http://example.com` | 公开站点完整地址，用于规范链接、分享图、评论和订阅。 |
| `root` | 字符串 | `/` | 站点路径前缀，例如 /blog/。 |
| `per_page` | 整数 | `10` | 每页文章数，0 表示关闭分页，由对应生成器读取。 |
| `index_generator.per_page` / `archive_generator.per_page` / `category_generator.per_page` / `tag_generator.per_page` | 整数 | `per_page` | 分别覆盖首页、归档、分类和标签分页。 |
| `archive_generator.enabled` / `yearly` / `monthly` / `daily` | 布尔值 | `true / true / true / false` | 归档生成器开关及归档分组，需要归档生成器。 |
| `archive_dir` / `category_dir` / `tag_dir` | 字符串 | `archives / categories / tags` | 生成器路由目录，建议保留默认值以配合主题内置链接。 |
| `feed` / `feed.enable` / `feed.path` | 布尔值, 映射 / 布尔值 / 字符串, 列表 | — | feed: false 或 feed.enable: false 关闭 Milo 自带输出和订阅发现。feed.path 配合站点订阅生成器使用。 |
| `theme_config` | 映射 | — | 可覆盖主题键，优先于 _config.milo.yml。 |
| `deploy` | 映射 | `{}` | hexo deploy 使用的托管平台配置，需要相应部署插件。 |

复制[站点配置示例](README.md#安装与入门)时，每个键只保留一份。以下示例让首页每页显示 6 篇，归档显示全部文章，并关闭月归档。Hexo 建站模板常已包含 `index_generator`，请修改其中的 `per_page`。

```yaml
per_page: 6
index_generator:
  per_page: 6
archive_generator:
  per_page: 0
  monthly: false
```

其他站点设置参阅 [Hexo 配置参考](https://hexo.io/docs/configuration.html)。

## 主题配置

修改站点根目录的 `_config.milo.yml`。npm、Git 和源码压缩包均附有[中文注释模板](../../_config.yml.example)和[英文注释模板](../../_config.en.yml.example)，可任选一份复制使用。两份模板的字段顺序、默认值和示例相同，包含配色、菜单和全部已识别的社交平台示例。升级时继续使用站点根目录中的原文件。除表中注明的服务或插件外，各选项由 Milo 提供。

| 字段 | 类型 | 默认值 | 实际作用 |
| --- | --- | --- | --- |
| `uiux.slogan` | 字符串 / 列表 | `""` | 作者简介，列表以空格连接。 |
| `uiux.primary_color` | 字符串 / 空值 | `null` | 浅色主按钮色，填写有效 CSS 颜色。 |
| `uiux.link_color` | 字符串 / 空值 | `null` | 浅色链接与强调色。 |
| `uiux.bg_color` | 字符串 / 空值 | `null` | 浅色背景色。 |
| `img.avatar` | 字符串 | `""` | 作者头像的站内路径或 HTTP(S) 地址，留空隐藏。 |
| `img.responsive` | 映射 | `{}` | 原图引用与预生成本地 WebP 候选路径列表的映射。原图和候选由作者提供。 |
| `head.favicon.ico` | 字符串 | `""` | Favicon 地址，例如 /images/favicon.png。 |
| `footer.custom_text` | 字符串 / 列表 / 空值 | `null` | 自定义页脚行，列表逐行显示，可用可信 HTML。 |
| `footer.copyright_since` | 整数 | `0` | 较早年份显示为起止年份，其他值只显示当年。 |
| `search.enable` | 布尔值 | `true` | 生成 search.json 和导航搜索按钮。搜索页需手动创建。 |
| `toc.enable` | 布尔值 | `true` | 启用标题目录，单篇 toc: false 可关闭。 |
| `reading.progress` | 布尔值 | `true` | 导航下沿的正文阅读进度。 |
| `reading.lightbox` | 布尔值 | `false` | 启用正文图片预览，单篇 lightbox: false 可关闭。 |
| `sidebar.sticky` | 布尔值 | `true` | 双栏时吸附最近文章和分类。 |
| `comment.disqus.shortname` | 字符串 | `""` | 填写已注册的 Disqus 标识，由字母、数字和连字符组成。留空停用，需要 Disqus。 |
| `feed.enable` | 布尔值 | `true` | 启用内置 Atom 及订阅发现；站点订阅生成器优先。 |
| `feed.limit` | 正整数 | `20` | 内置 Atom 包含的最新文章数。其他生成器有自己的数量设置。 |
| `seo.image` | 字符串 | `""` | 默认分享图，可用站内路径或 HTTP(S) 地址，优先级低于封面且高于头像。 |
| `menu` | 映射 / 空值 | `null` | 菜单标签映射到站内路径或 HTTP(S) URL，按填写顺序显示。null 使用默认菜单，{} 隐藏链接。 |
| `social` | 映射 | `{}` | 作者链接。支持以下子键以及自定义平台名，其他平台链接可填写 HTTP(S) URL。 |
| `social.github` / `social.website` | 字符串 | — | GitHub 或个人网站链接。 |
| `social.email` | 字符串 | — | 邮箱地址或 mailto: 链接。 |
| `social.rss` | 字符串 / 布尔值 | — | 订阅 URL 或 true，后者链接首个已有订阅地址。false 或空值隐藏。 |

社交平台的内置键还包括 `mastodon`、`bluesky`、`linkedin`、`x`、`youtube`、`instagram`、`bilibili` 和 `weibo`。这些平台有预设无障碍名称，使用通用链接图标。任意自定义平台名也可作为键。

下面的示例开启灯箱、作者链接与自定义配色，评论保持关闭。将自己的素材放在站点 `source/images/`，并提前生成 WebP 候选。用自己的值替换示例内容。给 `#` 开头的颜色加引号，改色后检查对比度。

```yaml
uiux:
  slogan: '读书与写作'
  primary_color: '#315c46'
  link_color: '#215c4a'
  bg_color: '#edf3ee'
img:
  avatar: /images/avatar.png
  responsive:
    /images/reading.jpg: [/images/reading-480.webp, /images/reading-960.webp]
head:
  favicon:
    ico: /images/favicon.png
footer:
  custom_text: ['阅读笔记']
  copyright_since: 2024
search:
  enable: true
toc:
  enable: true
reading:
  progress: true
  lightbox: true
sidebar:
  sticky: true
comment:
  disqus:
    shortname: ''
feed:
  enable: true
  limit: 20
seo:
  image: /images/share.png
menu:
  首页: /
  归档: /archives/
  分类: /categories/
  标签: /tags/
  关于: /about/
social:
  github: https://github.com/example
  email: reader@example.com
  rss: true
  website: https://example.com
```

Disqus 注册、订阅入口和分享图见[使用指南](README.md#功能配置)。页脚英文技术署名读取安装的 Hexo 和 Milo 版本。

## 文章与页面字段

把这些字段写入 Markdown 顶部的 Front Matter。省略可选字段时，继承相应的站点行为或留空。

| 字段 | 类型 | 默认值 | 实际作用 |
| --- | --- | --- | --- |
| `cover` / `thumbnail` | 字符串 | — | 封面与分享图，可用站内路径或 HTTP(S) URL，cover 优先。 |
| `cover_fit` | 字符串 | `cover` | cover 填满画框，contain 保留整图。 |
| `toc` | 布尔值 | 继承 | false 关闭单篇目录。启用时需要全站开关及正文标题。 |
| `lightbox` | 布尔值 | 继承 | false 关闭单篇灯箱。启用时需要全站开关。 |
| `comments` | 布尔值 | 继承 | false 隐藏当前内容的 Disqus，启用需配置有效 shortname。 |
| `title` / `author` | 字符串 | — | 文章标题和可选作者覆盖，作者缺失时用站点作者。 |
| `date` / `updated` | 日期时间 | `Hexo` | 发布日期与更新日期，日期不同时显示更新日期。 |
| `categories` / `tags` | 列表 | `[]` | 文章分类与标签，详情需对应生成器。 |
| `description` | 字符串 | — | SEO 描述，文章摘要优先。 |
| `lang` / `language` | 字符串 | 继承 | 页面语言，可影响界面与语言标记。文章正文按原文呈现。 |
| `layout` | 字符串 | `post / page` | 独立页面可用 about、categories、tags、search。 |

可复制[文章示例](README.md#文章写作)和[页面示例](README.md#页面与导航)。下方是可添加到文章 Front Matter 的其他字段示例。使用 `thumbnail` 时省略 `cover`，并提供实际存在的图片。

```yaml
thumbnail: /images/reading.jpg
author: 林读者
updated: 2026-01-18 09:00:00
lang: zh-CN
```

`<!-- more -->` 是 Hexo 的摘要标记。代码复制和阅读进度无需文章级配置。
