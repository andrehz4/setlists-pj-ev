# Jeremy a partir do refrão (58,2 s do disco, 105 BPM). Momento forte: Roskilde 1992 entra na batida 16 (volta do 2o "Jeremy").
# Uso: python3 -I gera.py <pasta-de-saida>
import json,subprocess,sys
O=sys.argv[1]; BPM=105; b=60/BPM; INI=58.2; TOTAL=37.2
ACERVO='/Users/andrehz/Documents/Githubhz/setlists-pj-ev/media/reels-clips/agitados/'
clips={k['file'][:-4]:k['dur'] for k in json.load(open(ACERVO+'clips.json'))['clips']}
L=[('seattle-1991-09',0,1),('roskilde-1992-09',0,1),('seattle-1991-12',0,1),('seattle-1991-11',1,2),
   ('jones-beach-ny-1992-02',6,2),('lollapalooza-1992-07',3,2),('seattle-1991-04',2,2),('vigas-pj20-04',0,1),('lollapalooza-1992-06',2,3),
   # momento forte (batida 16)
   ('roskilde-1992-01',1,8),('roskilde-1992-02',1,4),('roskilde-1992-05',1,4),
   ('seattle-1991-07',7,3),('roskilde-1992-06',0,2),('salto-lollapalooza-1992-01',4,4),('seattle-1991-08',0,1),
   ('lollapalooza-1992-09',0,2),('drop-in-the-park-seattle-1992-02',8,2),('jones-beach-ny-1992-01',10.5,2),('roskilde-1992-08',1,2),
   ('seattle-1991-01',2,2),('salto-moore-theatre-seattle-1992-cli-02',1.8,4),('roskilde-1992-11',1,2),('lollapalooza-1992-02',2,2),
   ('seattle-1991-06',1,2),('show-em-casa-fechada-nao-identificado-02',0,1),('escalada-extra-02',0,2),('seattle-1991-05',2,None)]
seg=[]; t=0
for c,o,nb in L:
    if t>=TOTAL: break
    d=nb*b if nb else TOTAL-t+0.05
    assert o+d<=clips[c]+0.01,(c,o,d,clips[c])
    d=min(d,TOTAL-t+0.05); seg.append((c,o,d,1)); t+=d
ins,f=[],[]
for i,(c,o,d,v) in enumerate(seg):
    ins+=['-ss',f'{o:.3f}','-t',f'{d:.3f}','-i',ACERVO+c+'.mp4']
    f.append(f"[{i}:v]setpts=PTS-STARTPTS,fps=30,format=yuv420p[v{i}]")
n=len(seg)
fc=';'.join(f)+';'+''.join(f'[v{i}]' for i in range(n))+f'concat=n={n}:v=1:a=0,eq=contrast=1.1:saturation=0.85:gamma=0.97,noise=alls=7:allf=t,vignette=PI/5,fade=t=out:st={TOTAL-0.8:.2f}:d=0.8[v]'
subprocess.run(['ffmpeg','-v','error','-y',*ins,'-filter_complex',fc,'-map','[v]','-t',str(TOTAL),'-c:v','libx264','-crf','19','-preset','medium','-pix_fmt','yuv420p','-movflags','+faststart',f'{O}/jeremy-mudo.mp4'],check=True)
print('montado',round(t,2),'s | roskilde entra em',round(16*b,2),'s')
json.dump({'inicio_no_disco':INI,'bpm':BPM,'total':TOTAL,'segmentos':seg},open(O+'/jeremy-montagem.json','w'),indent=1)
