import cv2, json, sys, numpy as np
cap=cv2.VideoCapture(sys.argv[1]); fps=cap.get(5); n=int(cap.get(7))
det=cv2.CascadeClassifier(cv2.data.haarcascades+"haarcascade_frontalface_default.xml")
out=[]; i=0
while True:
    ok,f=cap.read()
    if not ok: break
    if i%6==0:
        g=cv2.cvtColor(cv2.resize(f,(540,960)),cv2.COLOR_BGR2GRAY)
        fs=det.detectMultiScale(g,1.1,5,minSize=(40,40))
        if len(fs):
            x,y,w,h=max(fs,key=lambda r:r[2]*r[3]); out.append([i/fps,float(x+w/2)*2,float(y+h/2)*2,float(w)*2])
    i+=1
json.dump({"fps":fps,"n":n,"faces":out},open(sys.argv[2],"w"))
a=np.array(out); print(len(out), "dets of", n//6, "cx", np.percentile(a[:,1],[5,50,95]).round(), "cy", np.percentile(a[:,2],[5,50,95]).round(), "w", np.median(a[:,3]))
