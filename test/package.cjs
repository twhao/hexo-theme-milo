'use strict';
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {performance}=require('node:perf_hooks');
const {JSDOM}=require('jsdom');

const repo=path.resolve(__dirname,'..');
const manifest=require('../package.json');
const lock=require('../package-lock.json').packages;
const themeConfig='uiux:\n  slogan: Package fixture\nreading:\n  lightbox: true\n';
const siteConfig='title: Package fixture\nauthor: Example Author\nurl: https://example.com/journal\nroot: /journal/\ntheme: milo\nper_page: 6\nlanguage: ';

function run(cwd,command,...args){
  return execFileSync(command,args,{cwd,encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','inherit']});
}
function npm(cwd,...args){
  return run(cwd,process.execPath,process.env.npm_execpath,...args);
}
function pack(source,scratch){
  return JSON.parse(npm(source,'pack','--json','--ignore-scripts','--pack-destination',scratch))[0];
}
function install(site,scratch,archive){
  npm(site,'install','--ignore-scripts','--no-audit','--no-fund','--save-exact',path.join(scratch,archive.filename));
}

async function build(site){
  const started=performance.now();
  const code=`const Hexo=require('hexo'); const h=new Hexo(process.cwd(),{silent:true});
    (async()=>{await h.init(); await h.call('clean'); await h.call('generate'); await h.exit()})().catch(e=>{console.error(e);process.exitCode=1})`;
  run(site,process.execPath,'-e',code);
  return Math.round(performance.now()-started);
}

async function documentAt(site,route,check){
  const file=await fs.readFile(path.join(site,'public',route),'utf8');
  const {window}=new JSDOM(file,{url:'https://example.com/journal/'+route,runScripts:'outside-only'});
  try{await check(window.document,window)}finally{window.close()}
}

async function writeFixture(site){
  for(const page of ['about','categories','tags','search']){
    await fs.mkdir(path.join(site,'source',page),{recursive:true});
    await fs.copyFile(path.join(repo,'examples/pages',page+'.md'),path.join(site,'source',page,'index.md'));
  }
  await fs.writeFile(path.join(site,'_config.milo.yml'),themeConfig);
  await fs.writeFile(path.join(site,'_config.yml'),siteConfig+'zh-CN\n');
  await fs.writeFile(path.join(site,'package.json'),JSON.stringify({
    name:'milo-package-fixture',private:true,hexo:{version:lock['node_modules/hexo'].version},
    dependencies:Object.fromEntries(Object.keys(manifest.devDependencies).filter(name=>name==='hexo' || name.startsWith('hexo-'))
      .map(name=>[name,lock['node_modules/'+name].version]))
  }));
}

async function addPosts(site){
  const posts=path.join(site,'source/_posts');
  await fs.mkdir(posts);
  for(let i=1;i<=48;i++){
    const day=String((i-1)%28+1).padStart(2,'0');
    const title=i===1?'LongTitle'.repeat(24):'Post '+i;
    const topics=i===1?'':'categories: [Notes]\ntags: [Example]\n';
    const article=i===1?'## Chapter\n\n### Section\n\n#### Detail\n\n> Quotation\n\n- One\n- Two\n\n| A | B |\n| --- | --- |\n| Cell | Value |\n\n```js\nconst sample = 1;\n```\n\n![Sample](/images/milo-social.png)\n\n'+'A searchable paragraph.\n\n'.repeat(200):'A short post without a cover.';
    await fs.writeFile(path.join(posts,'post-'+i+'.md'),`---\ntitle: ${title}\ndate: 2026-01-${day}\n${topics}---\n${article}`);
  }
}

async function verifyConfigurationTemplate(site,scratch,archive){
  await writeFixture(site);
  install(site,scratch,archive);
  const theme=path.join(site,'node_modules',manifest.name);
  const template=path.join(theme,'_config.yml.example');
  const config=path.join(site,'_config.milo.yml');
  await fs.copyFile(template,config);
  const defaults=JSON.parse(run(site,process.execPath,'-e',`const assert=require('node:assert/strict'),Hexo=require('hexo');
    const h=new Hexo(process.cwd(),{silent:true});
    (async()=>{await h.init();const render=file=>h.render.render({path:file,engine:'yml'});
      const defaults=await render(${JSON.stringify(path.join(theme,'_config.yml'))});
      const chinese=await render(${JSON.stringify(config)});
      const english=await render(${JSON.stringify(path.join(theme,'_config.en.yml.example'))});
      assert.deepEqual(chinese,defaults);
      assert.equal(JSON.stringify(english),JSON.stringify(chinese),'Templates must have identical values and key order');
      console.log(JSON.stringify(defaults));
    })().catch(error=>{console.error(error);process.exitCode=1})`));
  await fs.mkdir(path.join(site,'source/_posts'));
  await fs.mkdir(path.join(site,'source/images'));
  await fs.copyFile(path.join(theme,'source/images/milo-social.png'),path.join(site,'source/images/reading.jpg'));
  await fs.writeFile(path.join(site,'source/images/reading-480.webp'),Buffer.from('UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA','base64'));
  await fs.writeFile(path.join(site,'source/_posts/first.md'),'---\ntitle: First\ndate: 2026-01-01\n---\nFirst post');
  await fs.writeFile(path.join(site,'source/_posts/second.md'),'---\ntitle: Second\ndate: 2026-01-02\ncover: /images/reading.jpg\n---\n## Chapter\n\n![Reading](/images/reading.jpg)');
  const post='2026/01/02/second/index.html';
  const output=file=>path.join(site,'public',file);
  await build(site);
  await documentAt(site,'index.html',doc=>{
    assert.equal(doc.querySelectorAll('.navlinks a').length,5);
    assert.ok(doc.querySelector('.search-toggle'));
    assert.ok(doc.querySelector('.sidebar-sticky.is-sticky'));
    assert.equal(doc.querySelector('.profile-social, .profile-heading img, .cover source, link[rel=icon]'),null);
  });
  await documentAt(site,post,doc=>{
    assert.ok(doc.querySelector('.toc-sidebar a'));
    assert.ok(doc.querySelector('.reading-progress progress'));
    assert.equal(doc.querySelector('#post-content').dataset.lightbox,'false');
    assert.equal(doc.querySelector('.load-comments'),null);
  });
  assert.equal(JSON.parse(await fs.readFile(output('search.json'),'utf8')).length,2);
  assert.equal((await fs.readFile(output('atom.xml'),'utf8')).match(/<entry>/g).length,2);

  await fs.copyFile(path.join(theme,'examples/_config.milo.yml'),config);
  await build(site);
  await documentAt(site,'index.html',doc=>{
    assert.equal(doc.querySelector('.slogan').textContent,'记录读书、写作和日常发现');
    assert.match(doc.querySelector('style').textContent,/--bg:#edf3ee;--accent:#215c4a;--button:#315c46;/);
    assert.equal(doc.querySelector('.profile-heading img').getAttribute('src'),'/journal/images/milo-social.png');
    assert.equal(doc.querySelector('link[rel=icon]').getAttribute('href'),'/journal/images/milo-social.png');
    assert.deepEqual([...doc.querySelectorAll('.profile-social a')].map(link=>link.getAttribute('href')),[
      'https://github.com/twhao/hexo-theme-milo','mailto:reader@example.com','/journal/atom.xml','https://example.com/'
    ]);
    assert.deepEqual([...doc.querySelectorAll('.navlinks a')].map(link=>link.getAttribute('href')),[
      '/journal/','/journal/archives/','/journal/categories/','/journal/tags/','/journal/about/'
    ]);
    assert.equal(doc.querySelector('meta[property="og:image"]').content,'https://example.com/journal/images/milo-social.png');
    assert.match(doc.querySelector('.footer').textContent,/阅读笔记 · 持续更新/);
  });
  for(const route of ['archives','categories','tags','about','search'])await documentAt(site,route+'/index.html',doc=>assert.ok(doc.querySelector('main'),route));
  await fs.access(output('images/milo-social.png'));
  await documentAt(site,post,doc=>{
    assert.equal(doc.querySelector('#post-content').dataset.lightbox,'true');
    assert.ok(doc.querySelector('.reading-progress progress'));
    assert.equal(doc.querySelector('.load-comments'),null);
  });

  const override={
    ...defaults,
    uiux:{slogan:['First','Second'],primary_color:'#315c46',link_color:'rgb(33, 92, 74)',bg_color:'hsl(150, 30%, 95%)'},
    img:{avatar:'/images/reading.jpg',responsive:{
      '/images/reading.jpg':['/images/reading-480.webp'],
      '/journal/images/reading.jpg':['/images/reading-480.webp']
    }},
    head:{favicon:{ico:'/images/reading.jpg'}},
    menu:{Home:'/',Projects:'https://example.org/projects/'},
    social:Object.fromEntries(['github','email','rss','website','mastodon','bluesky','linkedin','x','youtube','instagram','bilibili','weibo','Portfolio']
      .map(key=>[key,key==='rss'?true:key==='email'?'reader@example.com':'https://example.org/'+key])),
    search:{enable:false},toc:{enable:false},reading:{progress:false,lightbox:true},sidebar:{sticky:false},
    comment:{disqus:{shortname:'example-forum'}},feed:{enable:true,limit:1},seo:{image:'/images/reading.jpg'},
    footer:{custom_text:['First line','Second line'],copyright_since:2022}
  };
  await fs.writeFile(config,JSON.stringify(override));
  await build(site);
  await documentAt(site,'index.html',doc=>{
    assert.equal(doc.querySelector('.slogan').textContent,'First Second');
    assert.equal(doc.querySelector('.profile-heading img').getAttribute('src'),'/journal/images/reading.jpg');
    assert.equal(doc.querySelector('link[rel=icon]').getAttribute('href'),'/journal/images/reading.jpg');
    assert.equal(doc.querySelector('style').textContent,':root{--bg:hsl(150, 30%, 95%);--accent:rgb(33, 92, 74);--button:#315c46;}');
    assert.deepEqual([...doc.querySelectorAll('.navlinks a')].map(a=>a.getAttribute('href')),['/journal/','https://example.org/projects/']);
    const social=[...doc.querySelectorAll('.profile-social a')];
    assert.deepEqual(social.map(a=>a.getAttribute('aria-label')),['GitHub','邮箱','订阅','个人网站','Mastodon','Bluesky','LinkedIn','X','YouTube','Instagram','Bilibili','Weibo','Portfolio']);
    assert.equal(social[1].getAttribute('href'),'mailto:reader@example.com');
    assert.equal(social[2].getAttribute('href'),'/journal/atom.xml');
    assert.ok(doc.querySelector('.cover source').getAttribute('srcset').startsWith('/journal/images/reading-480.webp '));
    assert.equal(doc.querySelector('meta[property="og:image"]').content,'https://example.com/journal/images/reading.jpg');
    assert.match(doc.querySelector('.footer > div:first-child').textContent,/2022 – \d{4}/);
    assert.equal(doc.querySelector('.footer > div:nth-child(2)').innerHTML,'First line<br>Second line');
    assert.equal(doc.querySelector('.search-toggle, .sidebar-sticky.is-sticky'),null);
  });
  await documentAt(site,post,doc=>{
    assert.equal(doc.querySelector('.toc-sidebar, .reading-progress'),null);
    assert.equal(doc.querySelector('#post-content').dataset.lightbox,'true');
    assert.ok(doc.querySelector('#post-content picture source'));
    assert.equal(doc.querySelector('.load-comments').dataset.shortname,'example-forum');
  });
  await assert.rejects(fs.access(output('search.json')),{code:'ENOENT'});
  assert.equal((await fs.readFile(output('atom.xml'),'utf8')).match(/<entry>/g).length,1);
  override.feed.enable=false;
  await fs.writeFile(config,JSON.stringify(override));
  await build(site);
  await assert.rejects(fs.access(output('atom.xml')),{code:'ENOENT'});
  await documentAt(site,'index.html',doc=>assert.equal(doc.querySelector('.profile-social a[href$="atom.xml"], link[type="application/atom+xml"]'),null));
  console.log('Fresh install: copied configuration matches defaults and all 20 theme settings were exercised.');
}

async function verifyBrowser(site){
  const {withChromium}=require('./support/chromium.cjs');
  const root=path.join(site,'browser');
  await fs.cp(path.join(site,'public'),path.join(root,'journal'),{recursive:true});
  await withChromium(root,async({send,evaluate,navigate,errors})=>{
    for(const width of [320,390,800,801,1024,1440]){
      await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
      for(const route of ['index.html','about/','search/']){
        await navigate('/journal/'+route);
        assert.ok(await evaluate(`[...document.querySelectorAll('.navlinks a, .profile-social a, main h1:not(.sr)')].every(el=>{
          if(!el.getClientRects().length)return true;
          const rect=el.getBoundingClientRect();return rect.left>=-1 && rect.right<=innerWidth+1 && el.scrollWidth<=el.clientWidth+1;
        })`),route+' at '+width+'px');
      }
    }
    await navigate('/journal/about/');
    assert.equal(await evaluate(`document.querySelector('.profile-social a').getAttribute('aria-label')`),'GitHub');
    await evaluate(`document.querySelector('.appearance-button').click();document.querySelector('[data-mode="dark"]').click()`);
    assert.equal(await evaluate('document.documentElement.dataset.mode'),'dark');
    assert.deepEqual(errors,[]);
  });
  console.log('Chromium: English navigation, author links, dark mode and 18 viewport/route combinations passed.');
}

async function verifyLocales(site,defaultConfig){
  for(const [language,lang,home,heading] of [
    [null,'zh-CN','首页','你在寻找什么？'],
    ['zh-CN','zh-CN','首页','你在寻找什么？'],
    ['en-US','en-US','Home','What are you looking for?'],
    ['[fr, en]','en','Home','What are you looking for?'],
    ['fr','en','Home','What are you looking for?']
  ]){
    const config=language===null?siteConfig.replace(/language: $/,''):siteConfig+language+'\n';
    await fs.writeFile(path.join(site,'_config.yml'),config);
    await build(site);
    await documentAt(site,'index.html',doc=>{
      assert.equal(doc.documentElement.lang,lang);
      assert.equal(doc.querySelector('.navlinks a').textContent,home);
      const credit=doc.querySelector('.footer > div:last-child');
      assert.equal(credit.textContent,`Powered by Hexo ${lock['node_modules/hexo'].version} · Theme Milo ${manifest.version}`,language);
      assert.equal(credit.querySelector('a:last-of-type').href,'https://github.com/twhao/hexo-theme-milo',language);
    });
    await documentAt(site,'404.html',doc=>assert.equal(doc.querySelector('h1').textContent,heading));
  }
  await fs.writeFile(path.join(site,'_config.yml'),siteConfig+'en\n');
  await fs.writeFile(path.join(site,'_config.milo.yml'),defaultConfig+
    'menu:\n  Journal: /\n  Documentation with a long label: /about/\n  External: https://example.org\n  Invalid: "javascript:alert(1)"\nsocial:\n  github: https://github.com/example\n  email: author@example.com\n  rss: true\n  mastodon: https://example.org/@author\n  Invalid: "data:text/html,example"\n');
  await build(site);
  await documentAt(site,'index.html',doc=>{
    assert.deepEqual([...doc.querySelectorAll('.navlinks a')].map(a=>a.textContent),['Journal','Documentation with a long label','External']);
    assert.equal(doc.querySelector('.navlinks a[aria-current]').getAttribute('href'),'/journal/');
    assert.deepEqual([...doc.querySelectorAll('.profile-social a')].map(a=>[a.getAttribute('aria-label'),a.getAttribute('href')]),[
      ['GitHub','https://github.com/example'],['Email','mailto:author@example.com'],['Feed','/journal/atom.xml'],['Mastodon','https://example.org/@author']
    ]);
  });
  await documentAt(site,'about/index.html',doc=>assert.equal(doc.querySelectorAll('.profile-social a').length,4));
  await documentAt(site,'search/index.html',async(doc,window)=>{
    window.matchMedia=()=>({matches:false,addEventListener(){}});
    window.fetch=async()=>({ok:true,json:async()=>[{title:'Sample',content:'Sample content',tags:[],url:'/journal/sample/'}]});
    window.eval(await fs.readFile(path.join(site,'public/js/milo.js'),'utf8'));
    doc.querySelector('.search-toggle').click();
    assert.equal(doc.querySelector('.search-toggle').getAttribute('aria-label'),'Close search');
    doc.querySelector('#search-q').value='sample';
    doc.querySelector('.search-form').dispatchEvent(new window.Event('submit',{cancelable:true}));
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(doc.querySelector('.search-status').textContent,'Results found: 1.');
  });
  if(process.argv.includes('--browser'))await verifyBrowser(site);
}

async function main(){
  const scratch=await fs.mkdtemp(path.join(os.tmpdir(),'milo-package-'));
  try{
    const site=path.join(scratch,'site');
    const baseline=path.join(scratch,'baseline');
    await fs.mkdir(baseline);
    const archive=path.join(scratch,'baseline.tar');
    run(repo,'git','archive','--format=tar','--output='+archive,'v0.5.1');
    run(baseline,'tar','-xf',archive);
    const previous=pack(baseline,scratch);
    const current=pack(repo,scratch);
    const included=current.files.map(file=>file.path);
    for(const entry of ['_config.yml','_config.yml.example','_config.en.yml.example','layout/index.ejs','scripts/milo.js','source/images/lucide-LICENSE.txt','LICENSE','README.md','examples/_config.milo.yml','examples/pages/search.md'])assert.ok(included.includes(entry),entry);
    assert.deepEqual(included.filter(file=>file.startsWith('languages/')).sort(),['languages/en.json','languages/zh-CN.json']);
    for(const file of ['README.en.md','docs/zh-CN/README.md','docs/zh-CN/configuration.md','docs/en/README.md','docs/en/configuration.md'])assert.ok(included.includes(file),file);
    assert.deepEqual(included.filter(file=>!/^(?:(?:layout|scripts|source|languages|examples)\/|docs\/(?:zh-CN|en)\/(?:README|configuration)\.md$|(?:_config(?:\.yml(?:\.example)?|\.en\.yml\.example)|README(?:\.en)?\.md|LICENSE|CHANGELOG\.md|package\.json)$)/.test(file)),[]);

    await verifyConfigurationTemplate(path.join(scratch,'fresh-template'),scratch,current);
    await writeFixture(site);
    console.log('Installing and building v0.5.1 fixture.');
    install(site,scratch,previous);
    await addPosts(site);
    const before=await build(site);
    await documentAt(site,'index.html',doc=>assert.match(doc.querySelector('.footer').textContent,/Milo 0\.5\.1/));
    const assets=async()=>Promise.all(['css/milo.css','js/milo.js','js/reading.js','index.html','search.json'].map(async file=>(await fs.stat(path.join(site,'public',file))).size));
    const beforeAssets=await assets();

    install(site,scratch,current);
    console.log('Installed the current package over v0.5.1. Checking configuration and generated routes.');
    assert.equal(await fs.readFile(path.join(site,'_config.milo.yml'),'utf8'),themeConfig);
    assert.equal(await fs.readFile(path.join(site,'_config.yml'),'utf8'),siteConfig+'zh-CN\n');
    const after=await build(site);
    const afterAssets=await assets();
    const index=JSON.parse(await fs.readFile(path.join(site,'public/search.json'),'utf8'));
    assert.equal(index.length,48);
    assert.ok(index.every(post=>!/[\r\n]/.test(post.content)));
    await documentAt(site,'index.html',doc=>{
      assert.ok(doc.querySelector('.footer').textContent.includes('Milo '+manifest.version));
      assert.equal(doc.querySelector('.slogan').textContent,'Package fixture');
      assert.equal(doc.querySelector('.profile-social'),null);
      assert.equal(doc.querySelectorAll('.entry').length,6);
      assert.equal(doc.querySelector('.cover'),null);
    });
    await documentAt(site,'page/8/index.html',doc=>assert.ok(doc.querySelector('.pager')));
    await documentAt(site,'2026/01/01/post-1/index.html',doc=>{
      for(const selector of ['.toc-child .toc-child','.prose blockquote','.prose ul','.prose table','.prose img','.prose pre'])assert.ok(doc.querySelector(selector),selector);
      assert.equal(doc.querySelector('h1').textContent,'LongTitle'.repeat(24));
    });
    await verifyLocales(site,themeConfig);

    console.log('Checking an empty site and uninstalling the package.');
    const posts=path.join(site,'source/_posts');
    await fs.rename(posts,path.join(scratch,'fixture-posts'));
    await build(site);
    await documentAt(site,'index.html',doc=>{assert.equal(doc.querySelectorAll('.entry').length,0);assert.equal(doc.querySelector('main .muted').textContent,'Nothing here yet.')});
    for(const route of ['categories','tags'])await documentAt(site,route+'/index.html',doc=>assert.equal(doc.querySelector('main .muted').textContent,'Nothing here yet.'));
    assert.deepEqual(JSON.parse(await fs.readFile(path.join(site,'public/search.json'),'utf8')),[]);

    const saved=await fs.readFile(path.join(site,'_config.milo.yml'),'utf8');
    npm(site,'uninstall','--ignore-scripts','--no-audit','--no-fund',manifest.name);
    await assert.rejects(fs.access(path.join(site,'node_modules',manifest.name)),{code:'ENOENT'});
    assert.equal(await fs.readFile(path.join(site,'_config.milo.yml'),'utf8'),saved);
    console.log(JSON.stringify({
      hexo:lock['node_modules/hexo'].version,node:process.version,platform:process.platform,
      baseline:{archive:previous.size,unpacked:previous.unpackedSize,files:previous.entryCount,cleanBuildMs:before,assets:beforeAssets},
      candidate:{archive:current.size,unpacked:current.unpackedSize,files:current.entryCount,cleanBuildMs:after,assets:afterAssets}
    },null,2));
    console.log('Passed npm pack, installation, update, clean Hexo builds, locales, configuration and uninstall.');
  }finally{
    assert.equal(path.dirname(scratch),path.resolve(os.tmpdir()));
    await fs.rm(scratch,{recursive:true,force:true,maxRetries:3,retryDelay:100});
  }
}
main().catch(error=>{console.error(error);process.exitCode=1});
