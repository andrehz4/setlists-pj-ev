// Gera o "whoosh" do story por banda (aprovado pelo Andre em 2026-10-06, versão B). Sintético, sem direito autoral:
//   node scripts/agenda/redes/som/gerar-whoosh.cjs saida.wav 0.9 180 1400 220 0.35
// e depois: ffmpeg -i saida.wav -af "aecho=0.6:0.5:60:0.25" media/agenda/voz/whoosh.mp3
// whoosh estéreo: ruído rosa por um passa-banda que sobe e desce (passagem), volume em sino, pan esquerda->direita
const fs=require("fs"); const [,,dest,durS,fIni,fPico,fFim,graveS]=process.argv; const sr=44100, dur=+durS, n=Math.round(sr*dur);
let seed=7; const rnd=()=>{seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff*2-1;};
let p0=0,p1=0,p2=0; const rosa=()=>{const w=rnd(); p0=0.99765*p0+w*0.099; p1=0.963*p1+w*0.2965; p2=0.57*p2+w*1.0527; return (p0+p1+p2+w*0.1848)*0.25;};
const L=new Float32Array(n), R=new Float32Array(n); let x1=0,x2=0,y1=0,y2=0, g=0;
for(let i=0;i<n;i++){const t=i/n; const sobe=t<0.55? t/0.55 : 1-(t-0.55)/0.45; const f=t<0.55? +fIni*Math.pow(+fPico/+fIni,sobe) : +fFim*Math.pow(+fPico/+fFim,sobe);
 const Q=0.9, w=2*Math.PI*f/sr, al=Math.sin(w)/(2*Q), a0=1+al; const x=rosa();
 const y=(al/a0)*x-(al/a0)*x2-(-2*Math.cos(w)/a0)*y1-((1-al)/a0)*y2; x2=x1;x1=x;y2=y1;y1=y;
 const env=Math.exp(-Math.pow((t-0.55)/0.22,2)); g=0.995*g+0.005*Math.sin(2*Math.PI*55*i/sr)*Math.exp(-Math.pow((t-0.55)/0.12,2));
 const s=y*env+(+graveS)*g*3; const pan=Math.min(1,Math.max(0,(t-0.15)/0.75)); L[i]=s*Math.cos(pan*Math.PI/2); R[i]=s*Math.sin(pan*Math.PI/2);}
let m=0; for(let i=0;i<n;i++) m=Math.max(m,Math.abs(L[i]),Math.abs(R[i])); const b=Buffer.alloc(44+n*4);
b.write("RIFF",0);b.writeUInt32LE(36+n*4,4);b.write("WAVEfmt ",8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(2,22);b.writeUInt32LE(sr,24);b.writeUInt32LE(sr*4,28);b.writeUInt16LE(4,32);b.writeUInt16LE(16,34);b.write("data",36);b.writeUInt32LE(n*4,40);
for(let i=0;i<n;i++){b.writeInt16LE(Math.round(L[i]/m*0.75*32767),44+i*4);b.writeInt16LE(Math.round(R[i]/m*0.75*32767),46+i*4);} fs.writeFileSync(dest,b);
