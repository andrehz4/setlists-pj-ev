# Even Flow a partir do refrão: corte no tempo da música, salto do Pinkpop no "Oh" depois da pausa (78,08 s do disco).
# Uso: python3 -I gera-refrao.py <pasta-de-saida>   (lê os clipes de media/reels-clips/agitados)
import json,subprocess,sys
O=sys.argv[1]; b=60/103.4; INI=59.5; TOTAL=37.2
ACERVO='/Users/andrehz/Documents/Githubhz/setlists-pj-ev/media/reels-clips/agitados/'
clips={k['file'][:-4]:k['dur'] for k in json.load(open(ACERVO+'clips.json'))['clips']}
PULO=78.08-INI          # batida do "Oh"
FIM_A=PULO-1.5          # o pulo acontece 1,5 s depois do início do clipe do salto
A=[('clipe-even-flow-1992-01',0,1),('pinkpop-1992-01',0,1),('jones-beach-ny-1992-02',7,2),('vigas-pj20-03',0,2),('show-ao-ar-livre-nao-identificado-01',1,2),
   ('drop-in-the-park-seattle-1992-07',3,2),('jones-beach-ny-1992-01',10.5,2),('seattle-1991-13',0,2),('roskilde-1992-09',0,2),('clipe-even-flow-1992-07',0,2),
   # drop do Lollapalooza
   ('lollapalooza-1992-06',2.5,2),('salto-lollapalooza-1992-01',4.0,4),('lollapalooza-1992-08',0,2),
   # drop do Pinkpop: sobe no guindaste
   ('pinkpop-1992-02',0,2),('pinkpop-1992-04',0,None)]
C=[('pinkpop-1992-08',0,2),('seattle-1991-07',7,2),('roskilde-1992-06',0,2),('salto-moore-theatre-seattle-1992-cli-02',1.8,4),('roskilde-1992-01',1,2),
   ('seattle-1991-08',0,1),('roskilde-1992-13',0,1),('drop-in-the-park-seattle-1992-02',8,2),('roskilde-1992-05',1,2),('clipe-even-flow-1992-04',0,1),
   ('pinkpop-1992-12',0,2),('pinkpop-1992-09',0,None)]
seg=[]; t=0
for c,o,nb in A:
    d=nb*b if nb else FIM_A-t; d=min(d,clips[c]-o); seg.append((c,o,d,1)); t+=d
if abs(t-FIM_A)>0.02: c,o,d,v=seg[-1]; seg[-1]=(c,o,d+FIM_A-t,v); t=FIM_A
seg+=[('pinkpop-1992-14',0,1.5,1),('pinkpop-1992-14',1.5,1.5,0.5),('pinkpop-1992-14',3.0,2.75,1)]; t+=7.25
for c,o,nb in C:
    if t>=TOTAL: break
    d=nb*b if nb else clips[c]-o; d=min(d,clips[c]-o,TOTAL-t+0.05); seg.append((c,o,d,1)); t+=d
ins,f=[],[]
for i,(c,o,d,v) in enumerate(seg):
    ins+=['-ss',f'{o:.3f}','-t',f'{d:.3f}','-i',ACERVO+c+'.mp4']
    lento=f",minterpolate=fps=60:mi_mode=blend,setpts={1/v:.3f}*PTS" if v!=1 else ""
    f.append(f"[{i}:v]setpts=PTS-STARTPTS{lento},fps=30,format=yuv420p[v{i}]")
n=len(seg)
fc=';'.join(f)+';'+''.join(f'[v{i}]' for i in range(n))+f'concat=n={n}:v=1:a=0,eq=contrast=1.1:saturation=0.85:gamma=0.97,noise=alls=7:allf=t,vignette=PI/5,fade=t=out:st={TOTAL-0.8:.2f}:d=0.8[v]'
subprocess.run(['ffmpeg','-v','error','-y',*ins,'-filter_complex',fc,'-map','[v]','-t',str(TOTAL),'-c:v','libx264','-crf','19','-preset','medium','-pix_fmt','yuv420p','-movflags','+faststart',f'{O}/reel-even-flow-refrao-mudo.mp4'],check=True)
tot=sum(d/v for _,_,d,v in seg)
print('montado',round(tot,2),'s | pulo em',round(PULO,2),'s do reel')
json.dump({'inicio_no_disco':INI,'total':TOTAL,'pulo':PULO,'segmentos':seg},open('/Users/andrehz/Documents/Githubhz/setlists-pj-ev/reels-especiais/agitados-overlay/montagem/reel-even-flow-refrao.json','w'),indent=1)
