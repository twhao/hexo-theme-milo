# Milo configuration reference

[User guide](README.md) · [简体中文](../zh-CN/configuration.md)

## Site configuration

Edit `_config.yml` in the Hexo site root. Except for Milo's default language, these defaults come from Hexo 8.1.2 and the relevant generators. A starter template can set its own values.

| Setting | Type | Default | Effect |
| --- | --- | --- | --- |
| `title` | string | `Hexo` | Site title for navigation, sharing, and feeds. |
| `author` | string | `John Doe` | Author in the profile, about page, and footer. |
| `description` | string | `""` | Site description, falling back to the bio and title. |
| `language` | string / list | `zh-CN (Milo)` | Use zh-CN or en. Aliases include en-US and zh-Hans. Missing settings use Simplified Chinese. Unsupported selections use English. |
| `theme` | string | `landscape` | Set milo to enable the theme. A directory install takes priority over npm. |
| `url` | string | `http://example.com` | Public site URL for canonical links, share images, comments and feeds. |
| `root` | string | `/` | Site path prefix, such as /blog/. |
| `per_page` | integer | `10` | Entries per page. 0 disables pagination. Used by the respective generators. |
| `index_generator.per_page` / `archive_generator.per_page` / `category_generator.per_page` / `tag_generator.per_page` | integer | `per_page` | Overrides page size for the index, archives, categories, or tags. |
| `archive_generator.enabled` / `yearly` / `monthly` / `daily` | boolean | `true / true / true / false` | Archive generation and date grouping. Requires the archive generator. |
| `archive_dir` / `category_dir` / `tag_dir` | string | `archives / categories / tags` | Generator route directories. Keep the defaults for Milo’s built-in links. |
| `feed` / `feed.enable` / `feed.path` | boolean, mapping / boolean / string, list | — | feed: false or feed.enable: false disables Milo's built-in output and feed discovery. feed.path applies to an installed feed generator. |
| `theme_config` | mapping | — | Theme overrides taking precedence over _config.milo.yml. |
| `deploy` | mapping | `{}` | Hosting settings for hexo deploy. Requires a deployer plugin. |

When copying the [site configuration example](README.md#installation), keep one copy of each key. This example shows six posts per homepage and an unpaginated archive without monthly pages. If your starter already defines `index_generator`, edit its `per_page` there.

```yaml
per_page: 6
index_generator:
  per_page: 6
archive_generator:
  per_page: 0
  monthly: false
```

See the [Hexo configuration reference](https://hexo.io/docs/configuration.html) for other site settings.

## Theme configuration

Edit `_config.milo.yml` in your site root. npm, Git, and source archive installs ship both the [English-commented template](../../_config.en.yml.example) and the [Chinese-commented template](../../_config.yml.example). Either one can be copied as-is. They share the same field order, default values, and examples for colors, navigation, and every recognized social platform. Keep your site-root file when upgrading. Milo supplies these options unless the table lists an external service or plugin.

| Setting | Type | Default | Effect |
| --- | --- | --- | --- |
| `uiux.slogan` | string / list | `""` | Author bio. List entries are joined with spaces. |
| `uiux.primary_color` | string / null | `null` | Primary button color in light mode. Use a valid CSS color. |
| `uiux.link_color` | string / null | `null` | Link and accent color in light mode. |
| `uiux.bg_color` | string / null | `null` | Background color in light mode. |
| `img.avatar` | string | `""` | Site path or HTTP(S) avatar URL. Empty hides the avatar. |
| `img.responsive` | mapping | `{}` | Maps original image references to pre-generated local WebP lists. Supply the originals and variants. |
| `head.favicon.ico` | string | `""` | Favicon address, such as /images/favicon.png. |
| `footer.custom_text` | string / list / null | `null` | Custom footer lines. A list produces separate lines. Supports trusted HTML. |
| `footer.copyright_since` | integer | `0` | An earlier year produces a year range. Otherwise shows the current year. |
| `search.enable` | boolean | `true` | Generates search.json and enables navigation search. Create the search page separately. |
| `toc.enable` | boolean | `true` | Enables a heading-based table of contents. Disable on a post with toc: false. |
| `reading.progress` | boolean | `true` | Reading progress below the navigation bar. |
| `reading.lightbox` | boolean | `false` | Article image preview. Disable on a post with lightbox: false. |
| `sidebar.sticky` | boolean | `true` | Pins recent posts and categories in a two-column layout. |
| `comment.disqus.shortname` | string | `""` | Registered Disqus shortname with letters, digits, and hyphens. Empty disables comments. Requires Disqus. |
| `feed.enable` | boolean | `true` | Enables built-in Atom and feed discovery. A site feed generator takes precedence. |
| `feed.limit` | positive integer | `20` | Latest entries in the built-in Atom feed. Other generators have their own limit. |
| `seo.image` | string | `""` | Default share image from a site path or HTTP(S) URL. Post covers take precedence, followed by this image and then the avatar. |
| `menu` | mapping / null | `null` | Maps labels to site paths or HTTP(S) URLs in insertion order. null uses the default menu. {} hides menu links. |
| `social` | mapping | `{}` | Author links. Supports the keys below and custom platform names with HTTP(S) URLs. |
| `social.github` / `social.website` | string | — | GitHub or personal website link. |
| `social.email` | string | — | Email address or mailto: link. |
| `social.rss` | string / boolean | — | Feed URL or true to link the first available feed. false or empty hides it. |

Other recognized keys are `mastodon`, `bluesky`, `linkedin`, `x`, `youtube`, `instagram`, `bilibili`, and `weibo`. They use preset accessible names and a shared link icon. You can also use any custom platform name as a key.

This example enables the lightbox, author links, and custom colors. Comments remain disabled. Put your assets in `source/images/` and generate WebP variants in advance. Replace the example values with your own. Quote colors starting with `#` and check contrast after changing the palette.

```yaml
uiux:
  slogan: 'Reading and writing'
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
  custom_text: ['Reading Notes']
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
  Home: /
  Archives: /archives/
  Categories: /categories/
  Tags: /tags/
  About: /about/
social:
  github: https://github.com/example
  email: reader@example.com
  rss: true
  website: https://example.com
```

See the [user guide](README.md#features) for Disqus registration, feed links, and share images. The English technical credit in the footer uses the installed Hexo and Milo versions.

## Post and page fields

Set these in the front matter at the top of the Markdown file. An omitted field inherits the relevant site behavior or leaves an optional value unset.

| Setting | Type | Default | Effect |
| --- | --- | --- | --- |
| `cover` / `thumbnail` | string | — | Cover and share image from a site path or HTTP(S) URL. cover takes priority. |
| `cover_fit` | string | `cover` | cover fills the frame. contain shows the entire image. |
| `toc` | boolean | Inherits | false disables the table of contents. Requires the site switch and article headings when enabled. |
| `lightbox` | boolean | Inherits | false disables the lightbox on this post. Requires the site switch when enabled. |
| `comments` | boolean | Inherits | false hides Disqus on this content. Requires a valid shortname when enabled. |
| `title` / `author` | string | — | Post title and optional author override. Falls back to the site author. |
| `date` / `updated` | date-time | `Hexo` | Published and updated dates. The updated date appears when the dates differ. |
| `categories` / `tags` | list | `[]` | Post categories and tags. Detail pages require the relevant generators. |
| `description` | string | — | SEO description. The post excerpt takes priority. |
| `lang` / `language` | string | Inherits | Page language, affecting interface and language markup. Article text is preserved. |
| `layout` | string | `post / page` | Standalone pages can use about, categories, tags, or search. |

Copy the [post example](README.md#writing-posts) or [page example](README.md#pages-and-navigation) to try the settings. Add any of these optional fields to post front matter. Omit `cover` when using `thumbnail` and supply an existing image.

```yaml
thumbnail: /images/reading.jpg
author: Alex Reader
updated: 2026-01-18 09:00:00
lang: en
```

`<!-- more -->` is Hexo's excerpt marker. Code copying and reading progress need no post-level settings.
