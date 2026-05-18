// ATENCAO: Reddit bloqueia UA "bot" de IPs cloud. OAuth impossivel (Reddit fechou registro).
// Solucao: curl subprocess com UA browser-like + rssParser.parseString() para o XML.
// NAO substituir por rssParser.parseURL() — vai voltar a dar 403.

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import Parser from "rss-parser";

const execFileAsync = promisify(execFile);

const rssParser = new Parser({
  headers: { Accept: "application/rss+xml,application/atom+xml,*/*" },
  timeout: 15000,
});

const CURL_UA = "Mozilla/5.0 (X11; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0";

export async function fetchRedditRss(url) {
  const { stdout } = await execFileAsync("curl", [
    "-s", "-L",
    "-A", CURL_UA,
    "--header", "Accept: application/rss+xml,application/atom+xml,*/*",
    "--header", "Accept-Language: en-US,en;q=0.5",
    "--max-time", "15",
    url,
  ], { maxBuffer: 5 * 1024 * 1024 });
  return rssParser.parseString(stdout);
}
