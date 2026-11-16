// Entrega a imagem (folha ou story) ao visitante do jeito que o navegador dele aceita:
// 1. "Compartilhar": folha de compartilhamento do sistema, quando existe.
// 2. Navegador comum: download direto.
// 3. Navegador interno de app (Instagram, Facebook etc.), onde download não funciona: mostra a imagem na tela
//    pra segurar o dedo e salvar.
const DENTRO_DE_APP = /Instagram|FBAN|FBAV|FB_IAB|Line\/|TikTok|musical_ly|Twitter|Snapchat|; wv\)/i.test(navigator.userAgent);

function mostrar(url) {
  document.querySelector('#salvar-tela')?.remove();
  const tela = document.createElement('div');
  tela.id = 'salvar-tela';
  tela.innerHTML = '<p>Segure o dedo na imagem e escolha salvar.</p><img alt="Seu setlist"><button type="button">Fechar</button>';
  tela.querySelector('img').src = url;
  tela.querySelector('button').onclick = () => { tela.remove(); URL.revokeObjectURL(url); };
  document.body.append(tela);
}

export async function entregar(blob, nome, { compartilhar = false } = {}) {
  const arq = new File([blob], nome, { type: 'image/jpeg' });
  const podeCompartilhar = !!navigator.canShare?.({ files: [arq] });
  if (podeCompartilhar && compartilhar) {
    try { await navigator.share({ files: [arq], title: 'Meu setlist do Eddie no Ibirapuera' }); return 'compartilhado'; } catch (e) {
      if (e.name === 'AbortError') return 'cancelado';
    }
  }
  const url = URL.createObjectURL(blob);
  if (DENTRO_DE_APP || compartilhar) { mostrar(url); return 'tela'; }
  const a = Object.assign(document.createElement('a'), { href: url, download: nome });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return 'baixado';
}
