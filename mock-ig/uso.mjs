// Uso horário simulado da Graph API (o header x-app-usage e o alarme de rate limit do mock).
// Os DOIS limites da Meta que importam (doc oficial), rastreados lado a lado
// pra nunca mais confundir:
//
//  1. APP / Platform (code 4 "Application request limit reached") <- E O NOSSO.
//     "Calls within one hour = 200 * Number of Users" (usuarios ativos diarios
//     do app). Janela de 1 HORA. O erro que derruba o feed e code 4, entao e
//     ESTE o limite ativo. App pequena (~1 usuario) -> ~200 chamadas/h.
//     Header: X-App-Usage.call_count (% da janela de 1h).
//
//  2. BUC Instagram (code 80002) - OUTRO limite, NAO e o que estamos batendo.
//     "Calls within 24 hours = 4800 * Number of Impressions". Janela 24h,
//     cresce com o alcance. So entra se virmos code 80002, nao code 4.
//     Header: X-Business-Use-Case-Usage (type=instagram).
//
// O mock modela o limite 1 (code 4, janela 1h), que e o ativo. Defaults
// conservadores pra app pequena; o numero REAL sai no log do pipeline
// (X-App-Usage) numa run de verdade.
export const USERS = Number.isFinite(Number(process.env.MOCK_USERS)) && Number(process.env.MOCK_USERS) > 0
  ? Number(process.env.MOCK_USERS) : 1;
export const HOURLY_LIMIT = Number.isFinite(Number(process.env.MOCK_HOURLY_LIMIT)) && Number(process.env.MOCK_HOURLY_LIMIT) > 0
  ? Number(process.env.MOCK_HOURLY_LIMIT) : Math.max(1, 200 * USERS);
export const ALARM_PCT = Number.isFinite(Number(process.env.MOCK_ALARM_PCT)) && Number(process.env.MOCK_ALARM_PCT) > 0
  ? Number(process.env.MOCK_ALARM_PCT) : 80;
export const HOUR_MS = 60 * 60 * 1000;

// Conta 1 chamada Graph: no ciclo do post E no log horario (limite code 4).
// Recebe o store ja carregado, NAO salva (o caller salva). label ex: "POST /media".
export function bumpCall(s, label) {
  s.callCount = (s.callCount || 0) + 1;
  if (!s.callsByKind) s.callsByKind = {};
  s.callsByKind[label] = (s.callsByKind[label] || 0) + 1;
  if (!s.callLog) s.callLog = [];
  s.callLog.push(Date.now());
}

// Chamadas na ULTIMA HORA (janela do code 4, o limite ativo). Poda o log.
export function hourlyUsage(s) {
  const cutoff = Date.now() - HOUR_MS;
  s.callLog = (s.callLog || []).filter((t) => t >= cutoff);
  const used = s.callLog.length;
  const alarmAt = Math.round(HOURLY_LIMIT * ALARM_PCT / 100);
  return {
    used, limit: HOURLY_LIMIT, alarmAt, users: USERS,
    over: used > alarmAt, pct: Math.min(100, Math.round((used / HOURLY_LIMIT) * 100)),
  };
}
