import {readFile,writeFile,mkdir,copyFile,cp} from 'node:fs/promises';
import {existsSync} from 'node:fs';
const c=JSON.parse(await readFile('content.json','utf8'));
const e=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const safe=u=>/^(https?:|mailto:)/i.test(u)||/^(?!\/\/)[\w./-]+$/.test(u);
const links=o=>Object.entries(o).filter(([,url])=>url&&safe(url)).map(([label,url])=>url&&safe(url)?`<a href="${e(url)}">${e(label)}</a>`:`<span class="unconfigured">${e(label)}</span>`).join('');
const head=(title,css='style.css')=>`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${e(c.name)} — research, publications, and an interactive notebook."><title>${e(title)}</title><link rel="stylesheet" href="${css}"></head>`;
const footer=`<footer class="foot"><p>${e(c.name)}</p><a href="#top">Back to top</a></footer>`;
await mkdir('dist/research-book',{recursive:true});
const portrait=c.photo&&safe(c.photo)?`<img class="portrait" src="${e(c.photo)}" alt="${e(c.name)}" width="270" height="280">`:`<div class="portrait portrait-empty" aria-hidden="true"></div>`;
await writeFile('dist/index.html',`${head(c.name)}<body id="top"><a class="skip" href="#about">Skip to content</a><div class="page"><header class="profile">${portrait}<div><h1>${e(c.name)} ${c.nativeName ? `<span class="native"><span aria-hidden="true">; </span><span lang="zh">${e(c.nativeName)}</span></span>` : ''}</h1><nav class="navigation" aria-label="Main navigation"><a href="#about">About</a><a href="#news">News</a><a href="#research">Research</a><a href="research-book/index.html">Notebook</a><a href="#contact">Contact</a></nav></div></header><main><div class="about" id="about">${c.about.map(p=>`<p>${e(p)}</p>`).join('')}<div class="social">${links(c.links)}</div>${Object.values(c.links).every(x=>!x)?'<p class="social-note">Profile links will appear here when added.</p>':''}</div><section id="news"><h2>News</h2><ul class="news">${c.news.map(n=>`<li><span class="date">${e(n.date)}</span> · ${e(n.text)}${n.url&&safe(n.url)?` <a href="${e(n.url)}">Read more</a>`:""}</li>`).join('')}</ul></section><section id="research"><h2>Research</h2>${c.publications.map(p=>`<article class="research-paper"><figure><a href="${e(p.links.Paper)}" aria-label="Read ${e(p.title)}"><img src="${e(p.image)}" alt="${e(p.imageAlt)}" loading="lazy"></a></figure><div class="paper-copy"><h3>${e(p.title)}</h3><p class="authors">${e(p.authors).replaceAll(e(c.name),`<strong>${e(c.name)}</strong>`)}</p><p class="venue"><em>${e(p.venue)}</em></p><ul class="paper-summary"><li>${e(p.summary)}</li></ul><div class="paper-links"><a href="${e(p.links.Paper)}">[Paper]</a></div></div></article>`).join('')}</section><section id="research-book"><h2>Notebook</h2><p>I am often interested in a wide range of topics beyond my own research, and I enjoy reading books and sometimes learning mathematics and physics online. I find visualizations and interactive demonstrations especially helpful for understanding new ideas, so I use this notebook to support my own learning. Additionally, when I first started learning computational neuroscience, I often felt confused about how mathematics and models could help address neuroscience questions. I therefore hope to share my notebooks with the community, especially with students who are just starting out, so we can learn together.</p><p>Suggestions are always welcome!</p><a href="research-book/index.html">Explore the Notebook</a></section><section id="contact"><h2>Contact</h2><div class="contact-emails">${[c.contact.email,c.contact.personalEmail].filter(Boolean).map(email=>`<p><a href="mailto:${e(email)}">${e(email)}</a></p>`).join('')}</div></section></main>${footer}</div></body></html>`);
const notebookCatalog = c.notebooks.map(({ title, url }) =>
  `<li><a href="${e(url)}">${e(title)}</a></li>`
).join('\n');

await writeFile('dist/research-book/index.html', `${head('Notebook — ' + c.name, '../style.css')}
<body>
  <a class="skip" href="#book">Skip to content</a>
  <div class="page">
    <header class="book-header"><a href="../index.html">Personal website</a></header>
    <main class="book-main" id="book">
      <div class="book-intro">
        <h1>Notebook</h1>
        <p class="lead">Start with a question. Build intuition. Explore the mathematics.</p>
      </div>
      <ul class="notebook-list">${notebookCatalog}</ul>
    </main>
  </div>
</body></html>`);
await copyFile('style.css','dist/style.css');
if(existsSync('assets')) await cp('assets','dist/assets',{recursive:true});
console.log('Built homepage and Notebook directory.');
