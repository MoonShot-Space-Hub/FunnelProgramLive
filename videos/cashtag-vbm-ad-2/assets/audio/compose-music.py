# Original upbeat motivational bed, synthesized from scratch (no samples) -> copyright-free.
import numpy as np, soundfile as sf, sys
SR=48000; BPM=108; beat=60/BPM; DUR=float(sys.argv[2]) if len(sys.argv)>2 else 46
N=int(SR*DUR); L=np.zeros(N); R=np.zeros(N)
rng=np.random.default_rng(7)
def note(f): return 440*2**((f-69)/12)
def add(buf,start,sig):
    i=int(start*SR); 
    if i>=N: return
    j=min(N,i+len(sig)); buf[i:j]+=sig[:j-i]
def env(n,a=0.005,d=0.3,s=0.0,rel=0.05,length=None):
    t=np.arange(n)/SR; e=np.minimum(1,t/a)*((s+(1-s)*np.exp(-t/d)))
    r=int(rel*SR); e[-r:]*=np.linspace(1,0,r); return e
def piano(m,dur,vel=0.25):
    n=int(dur*SR); t=np.arange(n)/SR; f=note(m)
    s=sum((0.6**k)*np.sin(2*np.pi*f*(k+1)*t*(1+0.0004*k)) for k in range(6))
    return vel*s*env(n,0.003,0.9,0.05,0.08)
def pad(ms,dur,vel=0.05):
    n=int(dur*SR); t=np.arange(n)/SR; s=np.zeros(n)
    for m in ms:
        for det in (-0.07,0,0.07):
            ph=2*np.pi*note(m+det)*t; s+=np.sin(ph)+0.3*np.sin(2*ph)
    a=np.minimum(1,t/0.6)*np.minimum(1,(dur-t)/0.6); return vel*s*a/len(ms)
def bass(m,dur,vel=0.35):
    n=int(dur*SR); t=np.arange(n)/SR; f=note(m)
    s=np.tanh(2.5*np.sin(2*np.pi*f*t))+0.5*np.sin(np.pi*f*t)
    return vel*s*env(n,0.004,0.25,0.4,0.04)
def kick():
    n=int(0.35*SR); t=np.arange(n)/SR; f=50+90*np.exp(-t/0.03)
    return 0.9*np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t/0.12)
def clap():
    n=int(0.2*SR); t=np.arange(n)/SR; nz=rng.standard_normal(n)
    nz=np.convolve(nz,[1,-0.9],'same'); return 0.12*nz*np.exp(-t/0.05)
def hat(o=False):
    n=int((0.18 if o else 0.05)*SR); t=np.arange(n)/SR; nz=np.diff(rng.standard_normal(n+1))
    return 0.022*nz*np.exp(-t/(0.06 if o else 0.012))
# I–V–vi–IV in C major, voiced warm
prog=[(60,[48,55,60,64,67]),(55,[43,55,59,62,67]),(57,[45,57,60,64,69]),(53,[41,53,57,60,65])]
bar=4*beat; t0=0; k=0
while t0<DUR:
    root,ch=prog[k%4]; sec=t0/DUR
    full = 8*beat <= t0 < DUR-4*bar  # drums after intro, drop before outro
    for s in (L,R): add(s,t0,pad([m+12 for m in ch[2:]],bar+0.5))
    # piano arpeggio 8ths
    arp=[ch[2],ch[3],ch[4],ch[3]+12 if False else ch[4]+5 if False else ch[2]+12,ch[4],ch[3],ch[2]+12,ch[4]]
    for i,m in enumerate(arp):
        p=piano(m+12,beat*1.2,0.12 if i%2 else 0.16); add(L,t0+i*beat/2,p*0.9); add(R,t0+i*beat/2+0.008,p)
    if t0>=4*beat:
        for i in range(4):
            b=bass(root-24,beat*0.9); add(L,t0+i*beat,b); add(R,t0+i*beat,b)
    if full:
        for i in range(4):
            kk=kick(); add(L,t0+i*beat,kk); add(R,t0+i*beat,kk)
            if i%2==1: c=clap(); add(L,t0+i*beat,c); add(R,t0+i*beat,c*0.9)
            for j in range(2):
                h=hat(j==1); add(L,t0+i*beat+j*beat/2,h*0.8); add(R,t0+i*beat+j*beat/2,h)
    t0+=bar; k+=1
mix=np.stack([L,R],1)
# gentle compression + fades
mix=np.tanh(mix*1.2)/np.tanh(1.2)
fi=int(1.0*SR); fo=int(2.5*SR); mix[:fi]*=np.linspace(0,1,fi)[:,None]; mix[-fo:]*=np.linspace(1,0,fo)[:,None]
mix*=0.89/np.abs(mix).max()
sf.write(sys.argv[1],mix.astype(np.float32),SR)
