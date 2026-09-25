// Sobe arquivo direto pro Cloudflare R2 com a URL assinada que o backend devolve.
// O arquivo nunca passa pelo servidor do fórum.

import { api } from "./api.js";

export async function enviarArquivo(arquivo, aoProgredir = () => {}) {
  const pedido = await api("/contrib/uploads", { method: "POST", json: { mime: arquivo.type, size: arquivo.size } });
  await new Promise((ok, falha) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", pedido.upload_url);
    for (const [k, v] of Object.entries(pedido.headers)) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) aoProgredir(e.loaded / e.total); };
    xhr.onload = () => (xhr.status < 300 ? ok() : falha(new Error("O envio do arquivo falhou. Tente de novo.")));
    xhr.onerror = () => falha(new Error("A conexão caiu durante o envio. Tente de novo."));
    xhr.send(arquivo);
  });
  aoProgredir(1);
  return pedido.key;
}
