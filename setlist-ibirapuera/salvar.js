// Entrega a imagem (folha ou story) ou o vídeo do story ao visitante do jeito que o navegador dele aceita:
// 1. "Compartilhar": folha de compartilhamento do sistema, quando existe.
// 2. Navegador comum: download direto.
// 3. Navegador interno de app (Instagram, Facebook etc.), onde download não funciona: mostra a imagem na tela
//    pra segurar o dedo e salvar.
export const DENTRO_DE_APP = /Instagram|FBAN|FBAV|FB_IAB|Line\/|TikTok|musical_ly|Twitter|Snapchat|; wv\)/i.test(navigator.userAgent);

// Fecha a tela de salvar aberta e solta a blob URL dela (imagem ou vídeo), pra não ficar presa na memória.
export function fecharTela() {
  const t = document.querySelector('#salvar-tela');
  if (!t) return;
  if (t.dataset.blob) URL.revokeObjectURL(t.dataset.blob);
  t.remove();
}

function mostrar(url) {
  fecharTela();
  const tela = document.createElement('div');
  tela.id = 'salvar-tela';
  tela.dataset.blob = url;
  // instagram://story-camera abre o Instagram direto na câmera do story (o app precisa estar instalado).
  tela.innerHTML = `<ol class="passos"><li><b>1</b>Segure e salve</li><li><b>2</b>Abra o story</li><li><b>3</b>Escolha da galeria</li></ol>
    <img alt="Seu setlist"><div class="botoes"><a class="btn cheio" href="instagram://story-camera">Abrir o Instagram</a>
    <button type="button" class="btn">Fechar</button></div>`;
  tela.querySelector('img').src = url;
  tela.querySelector('button').onclick = fecharTela;
  document.body.append(tela);
}

export async function entregar(blob, nome, { compartilhar = false } = {}) {
  const video = blob.type.startsWith('video/');
  const arq = new File([blob], nome, { type: blob.type || 'image/jpeg' });
  const podeCompartilhar = !!navigator.canShare?.({ files: [arq] });
  if (podeCompartilhar && compartilhar && !DENTRO_DE_APP) { // no Instagram vai direto pros 3 passos
    try { await navigator.share({ files: [arq], title: 'Meu setlist do Eddie no Ibirapuera' }); return 'compartilhado'; } catch (e) {
      if (e.name === 'AbortError') return 'cancelado';
    }
  }
  const url = URL.createObjectURL(blob);
  if ((DENTRO_DE_APP || compartilhar) && !video) { mostrar(url); return 'tela'; } // vídeo: segurar e salvar não existe, baixa
  const a = Object.assign(document.createElement('a'), { href: url, download: nome });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return 'baixado';
}
