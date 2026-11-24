import json,os
B='/Users/andrehz/Documents/Githubhz/setlists-pj-ev/.momentos/'
P={'ras':'rasmqe-coyo-all-of-eddie-vedder-s-incredible-climbs-during-p','eya':'eyat4jojhkm-eddie-vedder-craziest-stage-climbing-and-dives-e',
'lol':'o4gpf6vmarc-pearl-jam-live-in-lollapalooza-92','drop':'aumgmvohr-4-pearl-jam-drop-in-the-park-1992-720p60',
'ros':'dft-mcugzlo-pearl-jam-1992-06-26-roskilde-denmark-full-conce','sea':'b46zx4js0-c-pearl-jam-1991-08-23-seattle-wa-full-concert',
'cd':'z-trti0gfm-pearl-jam-even-flow-live-countdown-1992'}
SH={'lol':'Lollapalooza 1992','drop':'Drop in the Park, Seattle 1992','ros':'Roskilde 1992 (26/06)','sea':'Seattle 1991 (23/08, Sounds of Seattle)','cd':'Countdown TV 1992 (Even Flow)'}
J={k:{p['id']:p for p in json.load(open(B+v+'/planos.json'))} for k,v in P.items()}
L=[
('eya','p73','p76','Jones Beach, NY 1992 (legenda na compilação)','Eddie de camiseta branca corre pelo palco e salta em cima da pilha de caixas de som',5),
('eya','p87','p90','Jones Beach, NY 1992 (legenda na compilação)','Eddie no topo do andaime lateral, contra o céu, muito acima do palco',5),
('ras','p148','p151','show não identificado (compilação, provável 1992)','Silhueta do Eddie escalando a escada da estrutura contra o céu, cabelo voando',5),
('ras','p152','p156','show ao ar livre não identificado (compilação, provável 1992)','Eddie sem camisa escalando torre com árvores e multidão atrás, e salto da torre para a galera',5),
('ras','p72','p73','show em casa fechada não identificado (compilação)','Eddie pendurado no balcão por cima da plateia, mãos da galera erguidas',5),
('ras','p80','p80','show em casa fechada não identificado (compilação)','Stage dive: Eddie de cabeça pra baixo, pernas pro ar, caindo na galera',5),
('ras','p99','p100','show não identificado (compilação)','Eddie rastejando por cima da treliça iluminada de rosa sobre o palco',5),
('eya','p27','p28','Lollapalooza 1992 (Chili Peppers no palco, filmagem de fã)','Eddie pendurado no teto pelas mãos, berrando no microfone. CONFERIR: pode ser o mesmo momento do PJ20 já escolhido',5),
('lol','p513','p523','Lollapalooza 1992','Eddie sobe a escada da estrutura, silhueta contra a luz',5),
('lol','p539','p544','Lollapalooza 1992','Eddie sem camisa escalando a pilha de caixas de som',5),
('lol','p545','p546','Lollapalooza 1992','Eddie surfando por cima da galera',5),
('drop','p740','p742','Drop in the Park, Seattle 1992','Eddie pendurado na treliça do teto do palco',5),
('drop','p750','p757','Drop in the Park, Seattle 1992','Eddie pendurado balançando no teto, sequência longa',5),
('ros','p261','p264','Roskilde 1992 (26/06)','Eddie carregado pela galera, crowd surf no meio do mar de gente',5),
('ros','p797','p800','Roskilde 1992 (26/06)','Eddie mergulhado no meio da multidão, galera agarrando',5),
('ros','p283','p286','Roskilde 1992 (26/06)','Eddie na beira do palco com mar de gente e céu azul',5),
('ros','p759','p760','Roskilde 1992 (26/06)','Silhueta do Eddie pisando no monitor, bandeiras e multidão',5),
('ros','p763','p766','Roskilde 1992 (26/06)','Eddie curvado pulando contra o céu na beira do palco',5),
('ros','p808','p809','Roskilde 1992 (26/06)','Headbang violento contra o céu, cabelo voando',5),
('ros','p314','p315','Roskilde 1992 (26/06)','Silhueta do Eddie em headbang contra o céu',5),
('ros','p364','p366','Roskilde 1992 (26/06)','Close de berro com punho cerrado',5),
('ros','p564','p564','Roskilde 1992 (26/06)','Berro de boca aberta contra o céu azul',5),
('ros','p677','p677','Roskilde 1992 (26/06)','Eddie de braço estendido apontando para o público',5),
('ros','p692','p693','Roskilde 1992 (26/06)','Eddie curvado cantando com a multidão inteira atrás',5),
('sea','p561','p569','Seattle 1991 (23/08, Sounds of Seattle)','Eddie escala a caixa de som e canta em pé lá em cima',5),
('sea','p572','p578','Seattle 1991 (23/08, Sounds of Seattle)','Headbang em cima da caixa de som, cabelo voando',5),
('sea','p689','p692','Seattle 1991 (23/08, Sounds of Seattle)','Eddie surfando nas mãos da galera',5),
('sea','p172','p173','Seattle 1991 (23/08, Sounds of Seattle)','Pulo com headbang, cabelo pro alto',5),
('sea','p472','p473','Seattle 1991 (23/08, Sounds of Seattle)','Close de berro com braço erguido',5),
('sea','p531','p531','Seattle 1991 (23/08, Sounds of Seattle)','Eddie pulando de perna erguida',5),
('sea','p82','p83','Seattle 1991 (23/08, Sounds of Seattle)','Berro com o microfone erguido pro alto',5),
('sea','p653','p653','Seattle 1991 (23/08, Sounds of Seattle)','Close de berro apontando pro público',5),
('sea','p148','p148','Seattle 1991 (23/08, Sounds of Seattle)','Berro olhando pro céu, microfone erguido',5),
('eya','p160','p161','show ao ar livre não identificado (compilação, provável 1992)','Close do Eddie escalando a treliça com árvores atrás',4),
('lol','p576','p578','Lollapalooza 1992','Eddie mergulhando pro público',4),
('drop','p168','p169','Drop in the Park, Seattle 1992','Crowd surf na frente do palco',4),
('drop','p724','p730','Drop in the Park, Seattle 1992','Eddie subindo o poste da estrutura',4),
('ros','p396','p396','Roskilde 1992 (26/06)','Fã invade o palco e abraça o Eddie',4),
('ros','p405','p405','Roskilde 1992 (26/06)','Eddie pulando contra o céu',4),
('cd','p76','p76','Countdown TV 1992 (Even Flow)','Close de berro olhando pra cima (tem marca d água COUNTDOWN no rodapé)',4),
]
out=[]
for k,a,b,show,d,n in L:
    out.append({'pasta':P[k],'id':a if a==b else f'{a}-{b}','ini':J[k][a]['ini'],'fim':J[k][b]['fim'],'show':show,'descricao':d,'nota':n})
out.sort(key=lambda x:-x['nota'])
f='/private/tmp/claude-501/-Users-andrehz-Documents-Githubhz-setlists-pj-ev/bb2da7bc-4cf6-49eb-905a-6d726e5961b1/scratchpad/montagem/selecao-agitados.json'
json.dump(out,open(f,'w'),ensure_ascii=False,indent=1)
from collections import Counter
print(len(out),Counter(x['show'].split(' (')[0] for x in out))
