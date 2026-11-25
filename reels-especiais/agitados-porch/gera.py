# Porch: corte no tempo da música (136 BPM), começa em 38,49 s do disco ("All the laws pass by").
# Momento forte: Eddie pendurado no teto (Drop in the Park, Seattle 1992) cai no beat 49, volta do refrão ("Hear my name", ~60,1 s do disco).
# Uso: python3 -I gera.py <pasta-de-saida>
import json,subprocess,sys
O=sys.argv[1]; b=60/136.0; INI=38.49; TOTAL=37.2
ACERVO='/Users/andrehz/Documents/Githubhz/setlists-pj-ev/media/reels-clips/agitados/'
clips={k['file'][:-4]:k['dur'] for k in json.load(open(ACERVO+'clips.json'))['clips']}
# (clipe, offset, batidas)
PRE=[('clipe-even-flow-1992-04',0,2),('roskilde-1992-08',1,2),('seattle-1991-01',1,2),('lollapalooza-1992-06',2,4),('roskilde-1992-04',0,2),
     ('seattle-1991-04',1,2),('jones-beach-ny-1992-02',3,4),('pinkpop-1992-02',0,2),('roskilde-1992-06',0,2),('vigas-pj20-03',0,2),
     ('drop-in-the-park-seattle-1992-04',0,4),('lollapalooza-1992-02',2,4),('seattle-1991-09',0,2),('roskilde-1992-05',2,2),
     ('show-ao-ar-livre-nao-identificado-01',1,4),('seattle-1991-05',2,2),('clipe-even-flow-1992-07',0,2),
     ('vigas-pj20-01',0,2),('vigas-pj20-02',0,2),('roskilde-1992-10',0,1)]
assert sum(n for *_,n in PRE)==49
POS=[('drop-in-the-park-seattle-1992-01',0,8),('drop-in-the-park-seattle-1992-02',2,8),('lollapalooza-1992-01',0,4),('drop-in-the-park-seattle-1992-03',1,4)]
seg=[]; t=0
for c,o,nb in PRE+POS:
    d=min(nb*b,clips[c]-o); seg.append((c,o,d,1)); t+=d
rest=TOTAL-t
# fecho: plano aberto dele pendurado e balançando no teto, ainda do Drop in the Park
seg+=[('drop-in-the-park-seattle-1992-03',2.9,rest+0.05,1)]
ins,f=[],[]
for i,(c,o,d,v) in enumerate(seg):
    ins+=['-ss',f'{o:.3f}','-t',f'{d:.3f}','-i',ACERVO+c+'.mp4']
    lento=f",minterpolate=fps=60:mi_mode=blend,setpts={1/v:.3f}*PTS" if v!=1 else ""
    f.append(f"[{i}:v]setpts=PTS-STARTPTS{lento},fps=30,format=yuv420p[v{i}]")
n=len(seg)
fc=';'.join(f)+';'+''.join(f'[v{i}]' for i in range(n))+f'concat=n={n}:v=1:a=0,eq=contrast=1.1:saturation=0.85:gamma=0.97,noise=alls=7:allf=t,vignette=PI/5,fade=t=out:st={TOTAL-0.8:.2f}:d=0.8[v]'
subprocess.run(['ffmpeg','-v','error','-y',*ins,'-filter_complex',fc,'-map','[v]','-t',str(TOTAL),'-c:v','libx264','-crf','19','-preset','medium','-pix_fmt','yuv420p','-movflags','+faststart',f'{O}/reel-porch-mudo.mp4'],check=True)
print('montado',round(sum(d/v for _,_,d,v in seg),2),'s | momento forte em',round(49*b,2),'s')
json.dump({'inicio_no_disco':INI,'total':TOTAL,'bpm':136,'segmentos':seg},open(O+'/reel-porch.json','w'),indent=1)
