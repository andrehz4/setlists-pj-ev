// Casca da página do painel do contador: visual escuro com o dourado do gerador, sem nada de fora (a chave fica na
// URL, então a página não carrega fonte, script nem imagem de outro domínio). Redesenha sozinha a cada 30 s.
import { desenhar } from "./painel-setlist-desenho.js";

const CSS = `
:root{--fundo:#0e0c08;--carta:#17140e;--linha:#2b261b;--texto:#f2efe6;--fraco:#a39d8c;--ouro:#f0b93a;--azul:#5b9bd5}
*{box-sizing:border-box}
body{margin:0;background:var(--fundo);color:var(--texto);font:15px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif}
.pagina{max-width:1080px;margin:0 auto;padding:20px 16px 56px}
header{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px 16px;border-bottom:1px solid var(--linha);padding-bottom:14px}
h1{margin:0;font-size:22px;letter-spacing:.01em}h1 em{font-style:normal;color:var(--ouro)}
#estado{margin-left:auto;color:var(--fraco);font-size:13px}#estado::before{content:"";display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--ouro);margin-right:6px}
#estado.fora::before{background:none;border:1px solid var(--fraco)}
h2{margin:0 0 12px;font-size:13px;text-transform:uppercase;letter-spacing:.12em;color:var(--ouro)}
h3{margin:0 0 8px;font-size:14px}
section{margin-top:28px}small,.nota,.quando{color:var(--fraco)}.nota{font-size:13px;margin:10px 0 0}.nota b{color:var(--texto)}.quando{margin:12px 0 0;font-size:13px}
.rot{font-size:13px;color:var(--fraco)}
.cartoes{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-top:14px}
.cartao{background:var(--carta);border:1px solid var(--linha);border-top:2px solid var(--ouro);border-radius:8px;padding:14px 16px;display:grid;grid-template-columns:auto 1fr;align-items:baseline;column-gap:8px}
.cartao .rot{grid-column:1/-1}.cartao b{font-size:46px;line-height:1.1;font-variant-numeric:tabular-nums}.cartao em{font-style:normal;font-size:24px;font-variant-numeric:tabular-nums}
.funis,.duas{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px 28px}
.funil,.duelo,.faixa{background:var(--carta);border:1px solid var(--linha);border-radius:8px;padding:14px 16px}
.etapa{display:grid;grid-template-columns:118px 1fr 56px 40px;align-items:center;gap:8px;padding:4px 0;font-size:14px}
.etapa b,.etapa small{text-align:right;font-variant-numeric:tabular-nums}
.trilho{height:10px;background:var(--linha);border-radius:4px;overflow:hidden}.trilho i{display:block;height:100%;background:var(--ouro);border-radius:0 4px 4px 0}
.duelo{margin-bottom:12px}.par{display:flex;gap:2px;height:14px;margin:8px 0}.par i{border-radius:4px;min-width:2px}
i.a{background:var(--ouro)}i.b{background:var(--azul)}i.nada{flex:1;background:var(--linha)}
.leg{display:flex;flex-wrap:wrap;gap:4px 18px;font-size:14px}.leg i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:6px}
.faixa{margin-bottom:12px}.cab{display:flex;flex-wrap:wrap;justify-content:space-between;gap:4px 12px}
.barras{display:flex;align-items:flex-end;gap:2px;height:96px;margin-top:10px;border-bottom:1px solid var(--linha)}
.col{flex:1;height:100%;display:flex;align-items:flex-end;position:relative}.col.virada{border-left:1px dashed var(--linha)}
.col i{width:100%;background:var(--ouro);border-radius:3px 3px 0 0;min-height:0}.col:hover{background:#ffffff0f}
.col:hover::after{content:attr(data-t);position:absolute;bottom:100%;left:50%;transform:translateX(-50%);white-space:nowrap;background:var(--texto);color:#111;font-size:12px;padding:3px 7px;border-radius:4px;z-index:2;pointer-events:none}
.col:nth-child(-n+6):hover::after{left:0;transform:none}.col:nth-last-child(-n+6):hover::after{left:auto;right:0;transform:none}
.eixo{display:flex;gap:2px;font-size:11px;color:var(--fraco);margin-top:4px}.eixo span{flex:1;white-space:nowrap;overflow:visible;width:0}
.rola{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:14px;font-variant-numeric:tabular-nums}
th,td{padding:7px 10px;text-align:right;border-bottom:1px solid var(--linha);white-space:nowrap}th:first-child{text-align:left}thead th{color:var(--fraco);font-weight:500}
.aviso{background:var(--carta);border:1px solid var(--ouro);border-radius:8px;padding:14px 16px;margin-top:20px}
@media(max-width:520px){.cartao b{font-size:38px}.etapa{grid-template-columns:96px 1fr 48px 36px;font-size:13px}}`;

export const aviso = (texto) => `<p class="aviso">${texto}</p>`;

// `miolo` já vem pronto (desenhar(retrato) ou um aviso). `vivo` liga a atualização automática.
export function pagina(miolo, vivo = true) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive"><meta name="referrer" content="no-referrer"><title>Painel do gerador de setlist</title>
<style>${CSS}</style></head><body><div class="pagina">
<header><h1>Gerador do <em>Ibirapuera</em></h1><span class="rot">contador interno</span><span id="estado">ao vivo, atualiza a cada 30 s</span></header>
<main id="miolo">${miolo}</main></div>
${vivo ? `<script>
const desenhar = ${desenhar.toString()};
const estado = document.getElementById("estado");
async function atualizar() {
  try {
    const r = await fetch(location.pathname + location.search + "&json=1", { cache: "no-store" });
    if (!r.ok) throw new Error(r.status);
    document.getElementById("miolo").innerHTML = desenhar(await r.json());
    estado.textContent = "ao vivo, atualiza a cada 30 s"; estado.className = "";
  } catch (e) { estado.textContent = "sem conexão, tentando de novo"; estado.className = "fora"; }
}
setInterval(atualizar, 30000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) atualizar(); });
</script>` : ""}</body></html>`;
}
