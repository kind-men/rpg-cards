import{B as e,H as t,J as n,K as r,Mt as i,Nt as a,T as o,U as s,W as c,Z as l,at as u,c as d,dt as f,et as p,ft as m,k as h,pt as g,z as _}from"../chunks/BLaozyYe.js";import{c as v}from"../chunks/hzvnnVrC.js";import"../chunks/Cfug8aQt.js";import{g as y}from"../chunks/Dkb1PTSG.js";import{t as b}from"../chunks/JHXuOL4z.js";import{_ as x}from"../chunks/C9Jjm7Hp.js";import{t as S}from"../chunks/bvQ_UmNb.js";var C=r(`<a> </a>`),w=r(`<aside class="docs-toc svelte-vlvvjk" aria-label="Documentation table of contents"><div class="docs-toc-card svelte-vlvvjk"><div class="docs-toc-title svelte-vlvvjk">On this page</div> <nav class="docs-toc-nav svelte-vlvvjk"></nav></div></aside>`);function T(t,n){let r=d(n,`items`,24,()=>[]);var i=w(),m=f(i),v=g(f(m),2);_(v,5,r,e,(e,t)=>{var n=C();let r;var i=f(n,!0);a(n),u(()=>{r=h(n,1,`docs-toc-link svelte-vlvvjk`,null,r,{"docs-toc-link-level-2":(l(t).level??1)===2,"docs-toc-link-level-3":(l(t).level??1)===3}),o(n,`href`,(l(t),p(()=>l(t).href))),s(i,(l(t),p(()=>l(t).label)))}),c(e,n)}),a(v),a(m),a(i),c(t,i)}var E=r(`<li><i> </i><!> </li>`),D=r(`<tr><td> <br/> <code> </code></td><td> </td><td><ul class="param-list svelte-svpi39"></ul></td></tr>`),O=r(`<table class="table table-striped content-type-table"><thead><tr><th scope="col" class="name">Name</th><th scope="col" class="description svelte-svpi39">Description</th><th scope="col" class="parameters">Parameters</th></tr></thead><tbody></tbody></table>`);function k(r){var i=O(),o=g(f(i));_(o,5,()=>x,e,(r,i)=>{var o=D(),d=f(o),p=f(d),m=g(p,3),h=f(m,!0);a(m),a(d);var v=g(d),y=f(v,!0);a(v);var b=g(v),x=f(b);_(x,5,()=>l(i).params,e,(e,r)=>{var i=E(),o=f(i),d=f(o,!0);a(o);var p=g(o),m=e=>{var t=n();u(()=>s(t,` (${l(r).type??``})`)),c(e,t)};t(p,e=>{l(r).type&&e(m)});var h=g(p);a(i),u(()=>{s(d,l(r).name),s(h,`:
                ${l(r).description??``}`)}),c(e,i)}),a(x),a(b),a(o),u(()=>{s(p,`${l(i).label??l(i).name??``} `),s(h,l(i).name),s(y,l(i).description)}),c(r,o)}),a(o),a(i),c(r,i)}var A=r(`<section class="docs-hero"><a class="docs-close-button" aria-label="Close documentation"><!></a> <div class="docs-hero-header"><img class="docs-logo" alt="RPG Cards logo"/> <div class="docs-hero-text"><h1 class="docs-hero-title">Documentation</h1> <p class="docs-hero-copy">Build, organize, and print polished RPG cards from one workspace. This guide covers the
        current editor, import and export formats, and the card data the app understands today.</p></div></div></section> <section class="docs-section" id="overview"><h2>Overview</h2> <p>The app is built around three areas:</p> <ul><li>The left sidebar for deck management, import and export, print settings, and card size presets.</li> <li>The center canvas for previewing the currently selected card.</li> <li>The right sidebar for editing the selected card, including cardback options, layout, and contents.</li></ul> <p>The right editor is split into two tabs:</p> <ul><li><strong>Content</strong> for editing content blocks individually or as plain text</li> <li><strong>Style</strong> for colors, title visibility, cardback settings, and custom CSS</li></ul> <p>On larger screens, both sidebars can be resized by dragging their outer edges. On smaller
    screens, the layout stacks vertically.</p></section> <section class="docs-section" id="working-with-cards"><h2>Working with cards</h2> <p>In the deck panel you can:</p> <ul><li>add cards</li> <li>select a card to edit it</li> <li>select multiple cards for batch editing</li> <li>duplicate cards</li> <li>delete cards</li> <li>choose a card size preset or use a custom size</li></ul> <p>In the editor panel you can:</p> <ul><li>edit the card title and color</li> <li>toggle whether the built-in card title is shown, unless a <code>cardtitle</code> content block is being used</li> <li>switch the cardback between icon mode and image mode</li> <li>manage one or more cardback images</li> <li>set cardback image sizing to <code>cover</code>, <code>contain</code>, or a custom CSS background-size value</li> <li>set a cardback background color and border style</li> <li>change border and background settings for the back of the card</li> <li>adjust layout settings such as title size, text size, and custom CSS</li> <li>edit card contents either block-by-block or as plain text</li></ul></section> <section class="docs-section" id="import-export"><h2>Import and export</h2> <p>The app can open JSON files from the left sidebar and export the current deck as JSON.</p> <p>Imports currently accept:</p> <ul><li>the current export format: an object with <code>version</code> and <code>cards</code></li> <li>an array of cards using the current object-based <code>contents</code> format</li> <li>a legacy single-card object where <code>contents</code> is a string array</li></ul> <p>When importing, the optional conversion toggles can transform subtitle-plus-rule pairs into
    sections and convert D&amp;D spell properties into spell blocks.</p> <p>In plain-text content mode, flat blocks use <code>type | value | value</code>. Nested rows use
    indentation: a <code>row</code> line contains indented <code>column</code> entries, and each
    column contains more indented content blocks. The same pipe-separated format is also used when
    importing legacy <code>contents</code> arrays.</p></section> <section class="docs-section" id="print-view"><h2>Print view</h2> <p>Use the print button in the left sidebar to open <code> </code>.</p> <p>The print settings currently control:</p> <ul><li>paper size</li> <li>print adjustment on the X and Y axes</li> <li>cardback border width</li></ul> <p>The print layout uses the selected card size from the deck panel and renders both fronts and
    backs.</p></section> <section class="docs-section" id="export-data"><h2>JSON Format</h2> <p>The current export format is a JSON object with these fields:</p> <ul><li><code>version</code> (string): export format version. Current value: <code>"1"</code></li> <li><code>cards</code> (array): list of cards. See <a href="#card-data">Card JSON data</a>.</li></ul> <p>Example:</p> <pre><code></code></pre> <hr/> <h3 id="card-data">Card</h3> <p>Cards can contain the following fields:</p> <ul><li><code>count</code> (number): amount of this card to print</li> <li><code>color</code> (string): card color</li> <li><code>title</code> (string): card title</li> <li><code>icon</code> (string): front icon</li> <li><code>icon_back</code> (string): icon used on the card back in icon mode. See <a href="#icons">Icons</a>.</li> <li><code>text_back</code> (string, optional): text shown on the back, such as a spell level</li> <li><code>cardback_mode</code> (string, optional): back style. Possible values: <code>"icon"</code>, <code>"images"</code></li> <li><code>cardback_images</code> (array, optional): list of cardback images when image mode is used</li> <li><code>cardback_background_color</code> (string, optional): background color behind cardback images</li> <li><code>cardback_border_style</code> (string, optional): cardback border style. Possible values: <code>"none"</code>, <code>"normal"</code></li> <li><code>tags</code> (array): list of tags</li> <li><code>layout</code> (object): per-card layout settings</li> <li><code>contents</code> (array): list of content blocks using object entries with <code>type</code> and optional <code>id</code>. Most blocks store <code>content</code>; <code>row</code> stores <code>children</code>. See <a href="#contents">Contents JSON data</a>.</li></ul> <p>Example:</p> <pre><code></code></pre> <h4>Cardback images</h4> <p>Each cardback image entry can contain:</p> <ul><li><code>src</code> (string): image source, typically a data URL after uploading an image in the editor</li> <li><code>size</code> (string, optional): image sizing mode or custom CSS background-size value</li></ul> <p>For compatibility, imported image arrays may also contain plain strings. Those are normalized to
    objects with <code>src</code> set to the string value and <code>size</code> defaulting to <code>"contain"</code>.</p> <hr/> <h3 id="layout-data">Layout</h3> <p>The <code>layout</code> object can contain:</p> <ul><li><code>show_title</code> (boolean, optional): show or hide the built-in card title row</li> <li><code>base_font_size</code> (string, optional)</li> <li><code>text_font_size</code> (string, optional)</li> <li><code>title_font_size</code> (string, optional)</li> <li><code>custom_css</code> (string, optional)</li></ul> <p>The editor currently exposes title visibility, title size, text size, and custom CSS. The
    exported layout object may still include <code>base_font_size</code> for compatibility.</p> <hr/> <h3 id="contents">Contents</h3> <p>Content objects have the following fields:</p> <ul><li><code>type</code> (string): content type used by the renderer. See <a href="#content-types">the table below</a>.</li> <li><code>content</code> (string): content parameters separated by a pipe <code>|</code> for non-row blocks</li> <li><code>children</code> (array): nested column lists for <code>row</code> blocks only</li> <li><code>id</code> (string, optional): unique id used by the editor</li></ul> <p><code>footer</code> remains a top-level block and is not valid inside a <code>row</code> column. The plain-text editor uses the same content encoding, one block per line. Newlines
    inside a block are stored as escaped <code>\\\\n</code> sequences in that mode.</p> <h4 id="content-types">Content types</h4> <!> <p>Examples:</p> <pre><code></code></pre> <p>Plain-text example:</p> <pre><code></code></pre></section> <section class="docs-section" id="icons"><h2>Icons</h2> <p>Icons available in RPG Cards Generator are provided by <a href="https://game-icons.net/">Game-icons.net</a>.</p></section>`,1);function j(e){var t=A(),n=m(t),r=f(n);y(f(r),{name:`x-lg`}),a(r);var l=g(r,2),d=f(l);i(2),a(l),a(n);var p=g(n,8),h=g(f(p),2),_=g(f(h)),b=f(_);a(_),i(),a(h),i(6),a(p);var x=g(p,2),S=g(f(x),8),C=f(S);C.textContent=`{
  "version": "1",
  "cards": [
    {
      "count": 1,
      "color": "#4a6898",
      "title": "Hex",
      "icon": "sparkles",
      "icon_back": "magic-swirl",
      "text_back": "1st Level",
      "cardback_mode": "icon",
      "cardback_images": [],
      "cardback_background_color": "#ffffff",
      "cardback_border_style": "normal",
      "tags": [],
      "layout": {
        "show_title": true,
        "title_font_size": "",
        "text_font_size": "",
        "custom_css": ""
      },
      "contents": [
        {
          "type": "row",
          "id": "04ea19f0-2655-44d4-9de5-595c9b554b75",
          "children": [
            [
              {
                "type": "text",
                "content": "Choose one creature you can see within range.",
                "id": "1a75fbc0-14b1-4285-9d8a-6e4e4f55ec8b"
              }
            ],
            [
              {
                "type": "bullet",
                "content": "Target takes necrotic damage.",
                "id": "89c7fb26-c2ba-4b28-a0bb-01c7c3dc9b11"
              }
            ]
          ]
        }
      ]
    }
  ]
}`,a(S);var w=g(S,12),T=f(w);T.textContent=`{
  "count": 1,
  "color": "#4a6898",
  "title": "Hex",
  "icon": "sparkles",
  "icon_back": "magic-swirl",
  "text_back": "1st Level",
  "cardback_mode": "icon",
  "cardback_images": [],
  "cardback_background_color": "#ffffff",
  "cardback_border_style": "normal",
  "tags": [],
  "layout": {
    "show_title": true,
    "base_font_size": "",
    "title_font_size": "",
    "text_font_size": "",
    "custom_css": ""
  },
  "contents": [
    {
      "type": "row",
      "id": "04ea19f0-2655-44d4-9de5-595c9b554b75",
      "children": [
        [
          {
            "type": "text",
            "content": "Choose one creature you can see within range.",
            "id": "1a75fbc0-14b1-4285-9d8a-6e4e4f55ec8b"
          }
        ],
        [
          {
            "type": "bullet",
            "content": "Target takes necrotic damage.",
            "id": "89c7fb26-c2ba-4b28-a0bb-01c7c3dc9b11"
          }
        ]
      ]
    }
  ]
}`,a(w);var E=g(w,32);k(E,{});var D=g(E,4),O=f(D);O.textContent=`[
  {
    "type": "row",
    "id": "0d50737a-8fb3-4fc8-a21a-66211c447bab",
    "children": [
      [
        {
          "type": "text",
          "content": "Left column text",
          "id": "04ea19f0-2655-44d4-9de5-595c9b554b75"
        }
      ],
      [
        {
          "type": "picture",
          "content": "https://example.com/spell.png | 90px",
          "id": "49dc81d8-a8d8-4e68-9f1c-01839f8ed47f"
        }
      ]
    ]
  },
  {
    "type": "dndspellblock",
    "content": "1 action | Self (15-foot radius) | V | Instantaneous",
    "id": "17252d82-2ff1-44f0-9a3b-8e82406a1d90"
  },
  {
    "type": "rule",
    "content": "",
    "id": "23e3310c-6e4f-4d9e-9849-93a9936fba71"
  },
  {
    "type": "text",
    "content": "You create a lash of lightning energy that strikes at one creature of your choice.",
    "id": "04ea19f0-2655-44d4-9de5-595c9b554b75"
  }
]`,a(D);var j=g(D,4),M=f(j);M.textContent=`section | Traits
row
  column
    text | Left column text
    row
      column
        bullet | Nested A
      column
        bullet | Nested B
  column
    picture | https://example.com/spell.png | 90px
footer | left | right`,a(j),a(x),i(2),u(()=>{o(r,`href`,`${v}/`),o(d,`src`,`${v}/logo_512.png`),s(b,`${v??``}/output`)}),c(e,t)}var M=r(`<div class="docs-page-layout svelte-1xmjmrw"><div class="docs-page-main svelte-1xmjmrw"><!></div> <!></div>`);function N(e){let t=[{href:`#overview`,label:`Overview`,level:1},{href:`#working-with-cards`,label:`Working with cards`,level:1},{href:`#import-export`,label:`Import and export`,level:1},{href:`#print-view`,label:`Print view`,level:1},{href:`#export-data`,label:`JSON Format`,level:1},{href:`#card-data`,label:`Card`,level:2},{href:`#layout-data`,label:`Layout`,level:2},{href:`#contents`,label:`Contents`,level:2},{href:`#content-types`,label:`Content types`,level:3},{href:`#icons`,label:`Icons`,level:1}];b(e,{view:`docs`,contentMaxWidth:`1120px`,children:(e,n)=>{S(e,{children:(e,n)=>{var r=M(),i=f(r);j(f(i),{}),a(i),T(g(i,2),{get items(){return t}}),a(r),c(e,r)},$$slots:{default:!0}})},$$slots:{default:!0}})}export{N as component};