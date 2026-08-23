import{$ as e,At as t,B as n,Ct as r,G as i,H as a,K as o,Nt as s,O as c,Pt as l,St as u,T as d,W as f,X as p,Z as m,a as h,at as g,d as _,dt as v,et as y,ft as b,gt as x,it as S,k as C,kt as w,mt as T,rt as E,yt as D,z as O}from"../chunks/Be68hMco.js";import"../chunks/D9FQP20W.js";import"../chunks/C02tyRh_.js";import{a as k,f as A,l as j,o as M,p as N,s as P,t as F,u as I}from"../chunks/DCwFCpiY.js";var L=o(`<section class="map-paper svelte-69t24f"><div><img class="map-page-image svelte-69t24f"/></div></section> <div style="break-after:page"></div>`,1),R=o(`<div></div>`),z=o(`<div class="map-output-empty svelte-69t24f" aria-live="polite"><p>Load, calibrate, and create at least one page before printing.</p></div>`);function B(o,B){t(B,!1);let V=()=>r(F,`$battlemapProject`,H),[H,U]=u(),W=T(),G=T(),K=T(),q=T(),J=T(),Y=T(!1),X=async()=>{await e(),x(Y,!0),requestAnimationFrame(()=>{if(window.parent!==window){let e=new URL(window.location.href).searchParams.get(`preview`)??``;window.parent.postMessage({type:`rpg-cards-map-output-ready`,previewToken:e},window.location.origin)}})},Z=()=>{let e=new URL(window.location.href).searchParams.get(`preview`)??``,t=(window.parent===window?void 0:window.parent)?.__rpgCardsMapPrintProjects?.[e]??sessionStorage.getItem(`rpg-cards-map-print-project:${e}`);if(t)try{F.set(A(JSON.parse(t)))}catch(e){console.warn(`Unable to read battlemap print preview snapshot.`,e)}};h(()=>{Z(),X()}),E(()=>V(),()=>{x(W,V())}),E(()=>m(W),()=>{x(G,P(m(W)))}),E(()=>(m(W),m(G)),()=>{x(K,k(m(W).imageSize,m(G)))}),E(()=>m(W),()=>{x(q,M(m(W).print))}),E(()=>(m(W),m(G)),()=>{x(J,m(W).imageSrc&&m(G)>0&&m(W).pages.length>0)}),E(()=>m(J),()=>{m(J)&&X()}),S(),_();var Q=i(),$=b(Q),ee=e=>{var t=R();let r;O(t,5,()=>(m(W),y(()=>m(W).pages)),n,(e,t)=>{let n=D(()=>(p(I),m(t),m(G),y(()=>I(m(t),m(G))))),r=D(()=>(p(j),m(t),m(G),y(()=>j(m(t),m(G)))));var i=L(),a=b(i),o=v(a);let u;var h=v(o);l(o),l(a),s(2),g(e=>{u=C(o,1,`map-page-clip svelte-69t24f`,null,u,{"map-page-grid-light":m(W).print.gridOverlay===`light`,"map-page-grid-dark":m(W).print.gridOverlay===`dark`,"map-page-crop-marks":m(W).print.showCropMarks}),c(o,e),d(h,`src`,(m(W),y(()=>m(W).imageSrc))),d(h,`alt`,(m(t),y(()=>m(t).name))),c(h,(p(m(r)),y(()=>`
              width: var(--map-width);
              height: var(--map-height);
              transform: translate(${m(r).x}mm, ${m(r).y}mm);
            `)))},[()=>(p(m(n)),p(N),m(W),m(t),m(G),y(()=>`
            width: ${m(n).width}mm;
            height: ${m(n).height}mm;
            --page-grid-offset-x: ${N(m(W).print.gridOffset.x-m(t).x,m(G))}mm;
            --page-grid-offset-y: ${N(m(W).print.gridOffset.y-m(t).y,m(G))}mm;
          `))]),f(e,i)}),l(t),g(()=>{r=C(t,1,`map-output svelte-69t24f`,null,r,{"map-output-visible":m(Y)}),c(t,(m(q),m(W),m(K),y(()=>`
      --paper-width: ${m(q).width}mm;
      --paper-height: ${m(q).height}mm;
      --margin-top: ${m(W).print.margins.top}mm;
      --margin-right: ${m(W).print.margins.right}mm;
      --margin-bottom: ${m(W).print.margins.bottom}mm;
      --margin-left: ${m(W).print.margins.left}mm;
      --adjust-x: ${m(W).print.adjust.x||0}mm;
      --adjust-y: ${m(W).print.adjust.y||0}mm;
      --map-width: ${m(K).width}mm;
      --map-height: ${m(K).height}mm;
    `)))}),f(e,t)},te=e=>{f(e,z())};a($,e=>{m(J)?e(ee):e(te,-1)}),f(o,Q),w(),U()}export{B as component};