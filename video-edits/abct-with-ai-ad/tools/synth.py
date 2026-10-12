import numpy as np, wave, sys
SR=48000; out=sys.argv[1]; rng=np.random.default_rng(7)
def save(name,x,st=False):
    x=np.clip(x,-1,1); 
    if not st: x=np.stack([x,x],1)
    w=wave.open(f"{out}/{name}.wav","w"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((x*32767).astype(np.int16).tobytes()); w.close()
def t(d): return np.arange(int(d*SR))/SR
def env(d,a,r): 
    tt=t(d); e=np.minimum(1,tt/max(a,1e-4))*np.exp(-np.maximum(0,tt-a)/r); return e
def lp(x,a): # one-pole lowpass, a in (0,1)
    y=np.empty_like(x); s=0.0
    for i,v in enumerate(x): s+=a*(v-s); y[i]=s
    return y
def bp_sweep(n,f0,f1,q=6):
    # state-variable filter with sweeping cutoff
    f=np.geomspace(f0,f1,len(n)); low=band=0.0; y=np.empty_like(n)
    for i,v in enumerate(n):
        F=2*np.sin(np.pi*f[i]/SR); high=v-low-band/q; band+=F*high; low+=F*band; y[i]=band
    return y
# whoosh
d=0.45; tt=t(d); n=rng.standard_normal(len(tt))
wh=bp_sweep(n,300,4500)*np.sin(np.pi*tt/d)**2; wh/=np.abs(wh).max(); save("whoosh",0.8*wh)
# reverse whoosh-ish riser (1.6s)
d=1.6; tt=t(d); n=rng.standard_normal(len(tt)); r=bp_sweep(n,200,7000,4)*(tt/d)**2; r/=np.abs(r).max()
r+=0.25*np.sin(2*np.pi*np.cumsum(np.geomspace(200,900,len(tt)))/SR)*(tt/d)**2; save("riser",0.6*r/np.abs(r).max())
# pop
d=0.12; tt=t(d); f=np.geomspace(1100,380,len(tt)); p=np.sin(2*np.pi*np.cumsum(f)/SR)*env(d,0.002,0.03); save("pop",0.7*p)
# tick (soft click for keyword)
d=0.05; tt=t(d); k=np.sin(2*np.pi*2400*tt)*env(d,0.0005,0.008); save("tick",0.45*k)
# impact (boom + noise)
d=1.2; tt=t(d); f=np.geomspace(120,38,len(tt)); b=np.sin(2*np.pi*np.cumsum(f)/SR)*env(d,0.003,0.35)
nz=lp(rng.standard_normal(len(tt)),0.08)*env(d,0.001,0.08); im=b+0.6*nz; save("impact",0.9*im/np.abs(im).max())
# ding (CTA)
d=1.0; tt=t(d); dg=sum(a*np.sin(2*np.pi*fr*tt)*env(d,0.002,dc) for fr,a,dc in [(1318.5,1,0.35),(2637,0.35,0.18),(1975.5,0.4,0.25)]); save("ding",0.5*dg/np.abs(dg).max())

# music bed: 104 BPM, C G Am F, 36.5s
BPM=104; beat=60/BPM; L=37.0; N=int(L*SR); mix=np.zeros((N,2))
def add(x,at,pan=0.0,g=1.0):
    i=int(at*SR); j=min(N,i+len(x)); 
    if i>=N: return
    mix[i:j,0]+=x[:j-i]*g*(1-pan)/1.0*(1 if pan<=0 else 1-pan); mix[i:j,1]+=x[:j-i]*g*(1+pan if pan<0 else 1)
def note(fr,d,amp=1.0):
    tt=t(d); e=env(d,0.008,d*0.45)
    x=(np.sin(2*np.pi*fr*tt)+0.35*np.sin(4*np.pi*fr*tt)+0.12*np.sin(6*np.pi*fr*tt)) * e
    x*=1+0.15*np.sin(2*np.pi*5*tt)  # tremolo, e-piano-ish
    return amp*x
kick_d=0.35; tt=t(kick_d); kick=np.sin(2*np.pi*np.cumsum(np.geomspace(150,45,len(tt)))/SR)*env(kick_d,0.002,0.09)
hh_d=0.06; hat=np.diff(np.r_[0,rng.standard_normal(int(hh_d*SR))])*env(hh_d,0.001,0.012)
cl_d=0.2; clap=bp_sweep(rng.standard_normal(int(cl_d*SR)),1500,1200,2)*env(cl_d,0.001,0.04); clap/=np.abs(clap).max()
mid=lambda m:440*2**((m-69)/12)
prog=[[60,64,67,72],[55,59,62,67],[57,60,64,69],[53,57,60,65]]  # C G Am F
bass=[36,43,45,41]
bar=4*beat; nb=int(L/bar)+1
for b in range(nb):
    t0=b*bar; ch=prog[b%4]
    for k in range(4):  # chord stabs on each beat, arpeggio feel
        for m in ch: add(note(mid(m),beat*0.95,0.10 if k in (0,2) else 0.07),t0+k*beat,pan=(m%5-2)/6)
        add(note(mid(ch[(k+1)%4]+12),beat*0.5,0.05),t0+k*beat+beat/2,pan=0.3)
    bt=t(bar*0.98); add(0.32*np.sin(2*np.pi*mid(bass[b%4])*bt)*np.minimum(1,bt/0.01)*np.exp(-bt/1.5),t0)
    if b>=1:  # drums come in after intro bar
        for k in range(4):
            if k in (0,2): add(kick,t0+k*beat,g=0.55)
            if k in (1,3): add(clap,t0+k*beat,g=0.18)
            for h in range(2): add(hat,t0+k*beat+h*beat/2,pan=0.25,g=0.10 if h else 0.06)
mix/=np.abs(mix).max(); mix*=0.8
fo=int(1.5*SR); mix[-fo:]*=np.linspace(1,0,fo)[:,None]
save("music",mix,st=True)
print("ok")
