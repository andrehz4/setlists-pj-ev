// Google Analytics (GA4) das páginas estáticas: mesmo ID do index.html, carregado 1s depois
// do load pra não pesar na primeira pintura. Mesmo trecho colado nas páginas .html soltas
// (fórum e privacidade) e em functions/_lib/forum-seo.js. Fora do colaborar.html de propósito:
// a CSP de lá bloqueia script inline (página de login e upload).
export const GA_ID = "G-234ZL5MF0T";

export const GA_SNIPPET = `<script>
window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());gtag('config','${GA_ID}');
addEventListener('load',function(){setTimeout(function(){var s=document.createElement('script');s.async=true;
s.src='https://www.googletagmanager.com/gtag/js?id=${GA_ID}';document.head.appendChild(s);},1000);},{once:true});
</script>`;
