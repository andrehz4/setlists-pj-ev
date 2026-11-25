# Alive a partir de 3:03 do disco (121->183,4 s): salto do Lollapalooza 1992 em câmera lenta no "Oh" (18,3 s do reel).
# Uso: python3 -I gera.py <pasta-de-saida>
import json,subprocess,sys
O=sys.argv[1]; b=0.8; INI=183.4; TOTAL=37.2
ACERVO='/Users/andrehz/Documents/Githubhz/setlists-pj-ev/media/reels-clips/agitados/'
clips={k['file'][:-4]:k['dur'] for k in json.load(open(ACERVO+'clips.json'))['clips']}
FIM_A=15.6   # salto começa (parte normal) aqui; lançamento no clipe em 4,8 s => reel 18,3 s
A=[('seattle-1991-12',0,1),('seattle-1991-09',1,1),('lollapalooza-1992-07',1,2),('seattle-1991-04',2,2),('show-em-casa-fechada-nao-identificado-02',0,1),
   ('drop-in-the-park-seattle-1992-03',2,2),('roskilde-1992-04',0.5,1),('roskilde-1992-10',0,1),('show-nao-identificado-02',0,2),('seattle-1991-01',2,2),
   ('seattle-1991-10',0,1),('lollapalooza-1992-02',2,2),('roskilde-1992-11',1,2)]
SALTO='salto-lollapalooza-1992-01'
B=[(SALTO,2.45,2.0,1),(SALTO,4.45,1.6,0.5),(SALTO,6.05,2.4,1)]
C=[('pinkpop-1992-12',0,2),('roskilde-1992-01',1,2),('seattle-1991-08',0,1),('roskilde-1992-06',0,2),('roskilde-1992-09',0,1),
   ('jones-beach-ny-1992-01',10.5,2),('seattle-1991-07',7,2),('vigas-pj20-04',0,1),('roskilde-1992-13',0,1),('lollapalooza-1992-09',4,2),('pinkpop-1992-09',0,None)]
seg=[]; t=0
for c,o,nb in A:
    d=min(nb*b,clips[c]-o); seg.append((c,o,d,1)); t+=d
c,o,d,v=seg[-1]; seg[-1]=(c,o,d+FIM_A-t,v); t=FIM_A
for s in B: seg.append(s); t+=s[2]/s[3]
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
subprocess.run(['ffmpeg','-v','error','-y',*ins,'-filter_complex',fc,'-map','[v]','-t',str(TOTAL),'-c:v','libx264','-crf','19','-preset','medium','-pix_fmt','yuv420p','-movflags','+faststart',f'{O}/reel-alive-mudo.mp4'],check=True)
print('montado',round(sum(d/v for _,_,d,v in seg),2),'s')
json.dump({'inicio_no_disco':INI,'total':TOTAL,'segmentos':seg},open(O+'/reel-alive.json','w'),indent=1)
