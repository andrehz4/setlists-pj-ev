# Once a partir do refrão ("Once upon a time"), 114,84 bpm, INI 81,92 s do disco. Momento forte (Seattle 1991, surf) na batida 32.
import json,subprocess,sys
O=sys.argv[1]; b=60/114.84; INI=81.92; TOTAL=37.2
ACERVO='/Users/andrehz/Documents/Githubhz/setlists-pj-ev/media/reels-clips/agitados/'
clips={k['file'][:-4]:k['dur'] for k in json.load(open(ACERVO+'clips.json'))['clips']}
S=[('seattle-1991-09',0,1),('roskilde-1992-09',0,2),('roskilde-1992-08',1,2),('seattle-1991-11',0,2),('lollapalooza-1992-06',2,2),
 ('seattle-1991-13',0,1),('roskilde-1992-06',0,2),('seattle-1991-08',0,2),('pinkpop-1992-12',0,1),('drop-in-the-park-seattle-1992-07',3,2),
 ('roskilde-1992-05',1,2),('seattle-1991-10',0,1),('jones-beach-ny-1992-01',4,2),('roskilde-1992-13',0,1),
 ('seattle-1991-01',1,2),('seattle-1991-04',0,2),('seattle-1991-05',2,4),
 # momento forte na batida 32: surf
 ('seattle-1991-07',4,6),('lollapalooza-1992-09',2,2),('roskilde-1992-01',1,2),('pinkpop-1992-14',1.5,4),('salto-lollapalooza-1992-01',4,4),
 ('roskilde-1992-09',0,1),('seattle-1991-06',1,2),('roskilde-1992-08',5,2),('vigas-pj20-06',0,1),('escalada-extra-04',2,3),
 ('seattle-1991-11',3,1),('lollapalooza-1992-08',0,2),('roskilde-1992-10',0,1),('seattle-1991-07',10,6),('seattle-1991-09',3,2),('seattle-1991-04',5,4),('roskilde-1992-07',0,4)]
seg=[];t=0
for c,o,nb in S:
    if t>=TOTAL: break
    d=min(nb*b,clips[c]-o,TOTAL-t+0.05); seg.append((c,o,d)); t+=d
ins,f=[],[]
for i,(c,o,d) in enumerate(seg):
    ins+=['-ss',f'{o:.3f}','-t',f'{d:.3f}','-i',ACERVO+c+'.mp4']
    f.append(f"[{i}:v]setpts=PTS-STARTPTS,fps=30,format=yuv420p[v{i}]")
n=len(seg)
fc=';'.join(f)+';'+''.join(f'[v{i}]' for i in range(n))+f'concat=n={n}:v=1:a=0,eq=contrast=1.1:saturation=0.85:gamma=0.97,noise=alls=7:allf=t,vignette=PI/5,fade=t=out:st={TOTAL-0.8:.2f}:d=0.8[v]'
subprocess.run(['ffmpeg','-v','error','-y',*ins,'-filter_complex',fc,'-map','[v]','-t',str(TOTAL),'-c:v','libx264','-crf','19','-preset','medium','-pix_fmt','yuv420p','-movflags','+faststart',f'{O}/reel-once-mudo.mp4'],check=True)
print('montado',round(t,2),'| batida 32 em',round(32*b,2),'s | total',n,'cortes')
acc=0
for c,o,d in seg: print(round(acc,2),c,o); acc+=d
json.dump({'inicio_no_disco':INI,'total':TOTAL,'segmentos':seg},open(O+'/reel-once.json','w'),indent=1)
