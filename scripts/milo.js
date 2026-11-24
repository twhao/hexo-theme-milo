'use strict';
const {stripHTML,unescapeHTML,escapeHTML}=require('hexo-util');
const clientKeys={
  appearance:['appearanceDark','appearanceLight','appearanceSystemDark','appearanceSystemLight'],
  searchToggle:['searchOpen','searchClose'],
  search:['searchEmpty','searchLoading','searchCount','searchNone','searchError'],
  comments:['commentsLoading','commentsError'],
  reading:['copy','codeScroll','copied','copyError','imagePreview','close','closeImage','zoom']
};

const defaultLanguage='zh-CN',fallbackLanguage='en';
const localeKey=value=>String(value || '').trim().toLowerCase().replace(/_/g,'-');
const languageAliases=new Map([['zh','zh-cn'],['zh-hans','zh-cn'],['zh-hans-cn','zh-cn']]);

hexo.extend.filter.register('after_init',async ()=>{
  // Hexo supplies its own English default before the theme loads.
  const settings=await hexo.render.render({path:hexo.config_path});
  if([].concat(settings?.language || []).some(localeKey))return;
  hexo.config.language=defaultLanguage;
  hexo.theme.i18n.languages=[defaultLanguage,'default'];
});

hexo.extend.filter.register('template_locals',locals=>{
  const {page,config,theme}=locals;
  const available=new Map(hexo.theme.i18n.list().map(language=>[localeKey(language),language]));
  function supportedLanguage(value){
    const key=localeKey(value);
    return available.get(key) || available.get(languageAliases.get(key)) ||
      (key.startsWith('en-')?available.get(fallbackLanguage):undefined);
  }
  const locale=[page.lang,...[].concat(config.language)].map(supportedLanguage).find(Boolean) || fallbackLanguage;
  const translate=hexo.theme.i18n.__([...new Set([locale,fallbackLanguage,defaultLanguage])]);
  locals.milo_t=(key,...args)=>translate('milo.'+key,...args);
  locals.milo_locale=()=>locale;
  locals.milo_document_language=()=>supportedLanguage(page.lang)===locale?locals.milo_content_language():locale;
  locals.milo_content_language=()=>{
    try{return Intl.getCanonicalLocales(page.lang.replace(/_/g,'-'))[0]}catch{return locale}
  };
  locals.milo_client_messages=()=>{
    const keys=[...clientKeys.appearance];
    if(theme.search.enable)keys.push(...clientKeys.searchToggle);
    if(page.layout==='search')keys.push(...clientKeys.search);
    if(page.comments!==false && theme.comment.disqus.shortname)keys.push(...clientKeys.comments);
    if(page.content)keys.push(...clientKeys.reading);
    return Object.fromEntries(keys.map(key=>[key,locals.milo_t(key,...(key==='searchCount'?['%s']:[]))]));
  };
},20);

function configuredLink(value,urlFor,allowMail=false){
  if(typeof value!=='string')return '';
  const href=value.trim();
  if(!href || /[\\\u0000-\u0020\u007f]/.test(href) || href.startsWith('//'))return '';
  if(!/^[a-z][a-z\d+.-]*:/i.test(href))return urlFor('/'+href.replace(/^\//,''));
  try{
    const url=new URL(href);
    if((/^https?:\/\//i.test(href) && url.hostname) || (allowMail && url.protocol==='mailto:' && url.pathname))return href;
  }catch{}
  return '';
}

hexo.extend.helper.register('milo_menu',function(){
  const defaults=[['home','/'],['archives','/archives/'],['categories','/categories/'],['tags','/tags/'],['about','/about/']];
  const menu=this.theme.menu;
  if(!menu || typeof menu!=='object' || Array.isArray(menu))return defaults.map(([key,href])=>[href,this.milo_t(key)]);
  return Object.entries(menu).flatMap(([label,href])=>configuredLink(href,value=>value)?[[href.trim(),label]]:[]);
});

hexo.extend.helper.register('milo_nav_current',function(href){
  if(/^[a-z][a-z\d+.-]*:/i.test(href))return false;
  const normalize=value=>value.replace(/index\.html$/,'').replace(/\/$/,'');
  const target=this.url_for('/'+href.replace(/^\//,''),{relative:false});
  return normalize(target)===normalize(this.url_for(this.page.path,{relative:false}));
});

hexo.extend.helper.register('milo_social',function(){
  const values=this.theme.social;
  if(!values || typeof values!=='object')return [];
  const platforms={github:'GitHub',mastodon:'Mastodon',bluesky:'Bluesky',linkedin:'LinkedIn',x:'X',youtube:'YouTube',instagram:'Instagram',bilibili:'Bilibili',weibo:'Weibo'};
  return Object.entries(values).flatMap(([key,value])=>{
    if(key==='rss' && value===true)value=feedPaths()[0];
    if(key==='email' && typeof value==='string' && /^[^\s:@]+@[^\s:@]+$/.test(value))value='mailto:'+value;
    const href=configuredLink(value,url=>this.url_for(url),key==='email');
    if(!href)return [];
    const label=Object.hasOwn(platforms,key)?platforms[key]:['email','website'].includes(key)?this.milo_t(key):key==='rss'?this.milo_t('feed'):key;
    return [{key,href,label}];
  });
});
// 构建期保护短中文词，保留原始文本、标点和普通换行作为降级。
const titleSegmenter=typeof Intl.Segmenter==='function'?new Intl.Segmenter('zh',{granularity:'word'}):null;
hexo.extend.helper.register('milo_title',value=>{
  const title=String(value ?? '');
  if(!titleSegmenter)return escapeHTML(title);
  return Array.from(titleSegmenter.segment(title),({segment,isWordLike})=>{
    const text=escapeHTML(segment);
    return isWordLike && /^\p{Script=Han}{2,6}$/u.test(segment)?'<span class="title-word">'+text+'</span>':text;
  }).join('');
});
const plainText=value=>unescapeHTML(stripHTML(String(value||''))).replace(/\s+/g,' ').trim();
hexo.extend.helper.register('milo_text',plainText);
hexo.extend.helper.register('milo_words',value=>(stripHTML(String(value||'')).match(/[\u3400-\u9fff]|[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)||[]).length);
hexo.extend.generator.register('milo-search',function(locals){
  if(hexo.theme.config.search?.enable===false)return [];
  const urlFor=hexo.extend.helper.get('url_for').bind(hexo);
  const posts=locals.posts.sort('date',-1).map(post=>({
    title:post.title,url:urlFor(post.path),content:plainText(post.content),tags:post.tags.map(tag=>tag.name)
  }));
  return {path:'search.json',data:JSON.stringify(posts)};
});

hexo.extend.helper.register('milo_post_count',function(page,site){
  if(page.category || page.tag){
    const items=page.category?site.categories:site.tags;
    const item=items.findOne({name:page.category || page.tag});
    return item?item.length:0;
  }
  if(!page.year)return site.posts.length;
  return site.posts.filter(post=>post.date.year()===Number(page.year) && (!page.month || post.date.month()+1===Number(page.month)) && (!page.day || post.date.date()===Number(page.day))).length;
});

const seoText=value=>unescapeHTML(stripHTML(Array.isArray(value)?value.join(' '):String(value || ''))).replace(/\s+/g,' ').trim();
hexo.extend.helper.register('milo_seo',function(){
  const {page,config,theme}=this,article=this.is_post();
  const t=this.milo_t;
  const base=seoText(config.description || theme.uiux.slogan || config.title);
  let label=page.title || '',description=base;
  if(page.category){label=t('seoCategory',page.category);description=t('seoCategoryDesc',page.category)+base;}
  else if(page.tag){label=t('seoTag',page.tag);description=t('seoTagDesc',page.tag)+base;}
  else if(page.archive){const period=[page.year,page.month,page.day].filter(Boolean).join(' / ');label=period?t('periodArchive',period):t('archives');description=t('seoArchiveDesc',label)+base;}
  else if(page.layout==='categories'){label=t('categories');description=t('seoCategories')+base;}
  else if(page.layout==='tags'){label=t('tags');description=t('seoTags')+base;}
  else if(page.miloDefault404){label=t('notFoundTitle');description=t('notFoundDescription');}
  if(article)description=seoText(page.excerpt) || seoText(page.description) || seoText(page.content) || base;
  else if(page.description)description=seoText(page.description);
  const suffix=page.current>1?t('pageNumber',page.current):'';
  const title=[seoText(label),suffix,seoText(config.title)].filter(Boolean).join(' | ');
  const image=page.cover || page.thumbnail || theme.seo?.image || theme.img.avatar || 'images/milo-social.png';
  // 本地图片先经过 url_for，适配 root 并避免重复子路径。
  const imageURL=new URL(this.url_for(image,{relative:false}),config.url.replace(/\/?$/,'/')).href;
  return {title,description:seoText(description).slice(0,160),url:this.full_url_for(page.path.replace(/index\.html$/,'')),image:imageURL,type:article?'article':'website'};
});
function hasFeedGenerator(){
  return ['feed','atom','rss2'].some(name=>hexo.extend.generator.get(name));
}
function feedPaths(){
  if(hexo.config.feed===false || hexo.config.feed?.enable===false || hexo.theme.config.feed?.enable===false)return [];
  if(hasFeedGenerator())return [].concat(hexo.config.feed?.path || 'atom.xml');
  return ['atom.xml'];
}
hexo.extend.helper.register('milo_feeds',()=>{
  const types=hasFeedGenerator()?[].concat(hexo.config.feed?.type || []):[];
  return feedPaths().map((path,index)=>({path,type:(types[index]?types[index]==='rss2':/rss/i.test(path))?'application/rss+xml':'application/atom+xml'}));
});
hexo.extend.generator.register('milo-feed',function(locals){
  if(!feedPaths().length || hasFeedGenerator())return [];
  const xml=value=>String(value || '').replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
  const full=path=>hexo.extend.helper.get('full_url_for').call(hexo,path);
  const limit=Number(hexo.theme.config.feed?.limit) || 20;
  const posts=locals.posts.sort('date',-1).limit(Math.max(1,limit)).toArray();
  const updated=posts.reduce((latest,p)=>Math.max(latest,+p.updated || +p.date),0);
  return {path:'atom.xml',data:'<?xml version="1.0" encoding="utf-8"?>'+
    '<feed xmlns="http://www.w3.org/2005/Atom"><title>'+xml(hexo.config.title)+'</title><id>'+xml(full(''))+'</id><link href="'+xml(full(''))+'"/><link rel="self" href="'+xml(full('atom.xml'))+'"/><updated>'+new Date(updated).toISOString()+'</updated><author><name>'+xml(hexo.config.author || hexo.config.title)+'</name></author>'+posts.map(p=>{
      const url=full(p.path.replace(/index\.html$/,''));
      return '<entry><title>'+xml(p.title)+'</title><id>'+xml(url)+'</id><link href="'+xml(url)+'"/><published>'+p.date.toISOString()+'</published><updated>'+(p.updated || p.date).toISOString()+'</updated><summary>'+xml(seoText(p.excerpt || p.description || p.content).slice(0,300))+'</summary></entry>';
    }).join('')+'</feed>'};
});

// 图片元数据只读取本地资源，不访问网络。
const fs=require('node:fs'),path=require('node:path'),{imageSize}=require('image-size');
const imageCache=new Map();
function localImageSize(src,context){
  try{
    const site=new URL(context.config.url),url=new URL(src,context.full_url_for(context.page?.path || ''));
    if(!['http:','https:'].includes(url.protocol) || url.origin!==site.origin)return;
    let name=decodeURIComponent(url.pathname),root=context.config.root || '/';
    if(root!=='/' && name.startsWith(root))name=name.slice(root.length);
    name=name.replace(/^\/+/, '');
    const candidates=[...new Set([hexo.source_dir,path.join(hexo.theme_dir,'source')].filter(Boolean))].map(base=>({base,name}));
    if(context.page?.asset_dir && !/^(?:[a-z]+:|\/)/i.test(src))candidates.unshift({base:context.page.asset_dir,name:decodeURIComponent(src.split(/[?#]/)[0])});
    for(const candidate of candidates){
      const base=path.resolve(candidate.base),file=path.resolve(base,candidate.name);
      if(!file.startsWith(base+path.sep))continue;
      try{
        const stat=fs.statSync(file);if(!stat.isFile())continue;
        const cached=imageCache.get(file);if(cached?.stamp===stat.mtimeMs && cached.size===stat.size)return cached.dimensions;
        const descriptor=fs.openSync(file,'r');let dimensions;
        try{const buffer=Buffer.alloc(Math.min(stat.size,256*1024));const bytes=fs.readSync(descriptor,buffer,0,buffer.length,0);dimensions=imageSize(buffer.subarray(0,bytes))}finally{fs.closeSync(descriptor)}
        if(!(dimensions.width>0 && dimensions.height>0))continue;
        if([5,6,7,8].includes(dimensions.orientation))[dimensions.width,dimensions.height]=[dimensions.height,dimensions.width];
        imageCache.set(file,{stamp:stat.mtimeMs,size:stat.size,dimensions});return dimensions;
      }catch(e){}
    }
  }catch(e){}
}
// 站点可提供预生成的 WebP，宽度从真实文件读取，缺失候选时沿用原图。
function webpSources(src,context){
  const images=context?.theme?.img?.responsive;
  if(!images || !Object.hasOwn(images,src) || !Array.isArray(images[src]))return '';
  const sources=new Map();
  for(const variant of images[src]){
    if(typeof variant!=='string' || !/^\/(?!\/)[^\s,?#\\]+\.webp$/i.test(variant))continue;
    const url=context.url_for(variant,{relative:false});
    const dimensions=localImageSize(url,context);
    if(dimensions?.type==='webp')sources.set(dimensions.width,url);
  }
  return [...sources].sort(([a],[b])=>a-b).map(([width,url])=>url+' '+width+'w').join(', ');
}
hexo.extend.helper.register('milo_webp',function(src){return webpSources(src,this)});

// 只增强文章输出，SEO、摘要和订阅保留原始内容。
hexo.extend.helper.register('milo_reading_content',function(content){
  let firstImage=true,inPicture=false;
  return String(content || '').replace(/<!--[\s\S]*?-->|<(pre|script|style)\b[^>]*>[\s\S]*?<\/\1\s*>|<\/?picture\b(?:[^>"']|"[^"]*"|'[^']*')*>|<img\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi,(tag,block,offset)=>{
    if(/^<\/?picture\b/i.test(tag))inPicture=!tag.startsWith('</');
    if(!/^<img\b/i.test(tag))return tag;
    const attributes=new Map([...tag.matchAll(/\s([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)].map(m=>[m[1].toLowerCase(),m[2] ?? m[3] ?? m[4] ?? '']));
    const add=[],first=firstImage && stripHTML(String(content || '').slice(0,offset)).length<600;firstImage=false;
    const lazy=(attributes.get('loading') ?? (first?'eager':'lazy')).toLowerCase()==='lazy';
    if(!attributes.has('loading'))add.push('loading="'+(first?'eager':'lazy')+'"');
    if(first && !attributes.has('fetchpriority') && !lazy)add.push('fetchpriority="high"');
    if(!attributes.has('decoding'))add.push('decoding="async"');
    const src=attributes.get('src') || '',root=this?.config?.root || '/';
    if(!attributes.has('width') || !attributes.has('height') || (root!=='/' && src.startsWith('/') && !src.startsWith('//') && !src.startsWith(root))){
      const dimensions=localImageSize(unescapeHTML(src),this);
      if(dimensions){
        if(root!=='/' && src.startsWith('/') && !src.startsWith('//') && !src.startsWith(root))tag=tag.replace(/(\ssrc\s*=\s*)("[^"]*"|'[^']*'|[^\s>]+)/i,(_,prefix)=>prefix+'"'+escapeHTML(this.url_for(unescapeHTML(src),{relative:false}))+'"');
        const width=Number(attributes.get('width')),height=Number(attributes.get('height'));
        if(!attributes.has('width'))add.push('width="'+(height>0?Math.round(height*dimensions.width/dimensions.height):dimensions.width)+'"');
        if(!attributes.has('height'))add.push('height="'+(width>0?Math.round(width*dimensions.height/dimensions.width):dimensions.height)+'"');
      }
    }
    if(add.length)tag=tag.replace(/\s*\/?>(?=\s*$)/,' '+add.join(' ')+'$&');
    if(inPicture || attributes.has('srcset'))return tag;
    const sources=webpSources(unescapeHTML(src),this);
    if(!sources)return tag;
    const sizes=(lazy?'auto, ':'')+'(max-width: 808px) calc(100vw - 48px), 760px';
    return '<picture data-milo-responsive><source type="image/webp" srcset="'+escapeHTML(sources)+'" sizes="'+sizes+'">'+tag+'</picture>';
  });
});

hexo.extend.generator.register('milo-404',function(locals){
  // 站点自备的 404 页面优先于主题默认页面。
  if(fs.existsSync(path.join(hexo.source_dir,'404.html')) || locals.pages.toArray().some(page=>page.path==='404.html'))return [];
  return {path:'404.html',layout:['404'],data:{layout:'404',miloDefault404:true}};
});

hexo.extend.generator.register('milo-empty-index',function(locals){
  const index=hexo.config.index_generator;
  // 启用分页时，Hexo 的首页生成器在没有文章时不会产生路由。
  if(locals.posts.length || !hexo.extend.generator.get('index') || !index?.per_page)return [];
  const prefix=String(index.path || '').replace(/^\/+|\/+$/g,'');
  const route=prefix?prefix+'/index.html':'index.html';
  if(locals.pages.toArray().some(page=>page.path===route) || fs.existsSync(path.join(hexo.source_dir,route)))return [];
  return {path:route,layout:index.layout,data:{__index:true,posts:locals.posts}};
});

hexo.extend.helper.register('milo_versions', () => ({hexo: hexo.version, milo: require('../package.json').version}));
