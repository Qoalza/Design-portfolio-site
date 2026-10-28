import json, re, copy, pathlib, xml.etree.ElementTree as ET
out=pathlib.Path(__file__).resolve().parent
END=240
V=lambda k:{'a':0,'k':k}
def kf(points):
 return {'a':1,'k':[{'t':t,'s':s,'o':{'x':.22,'y':0},'i':{'x':.24,'y':1}} for t,s in points[:-1]]+[{'t':points[-1][0],'s':points[-1][1]}]}
def shape(points,closed):return {'v':points,'i':[[0,0] for _ in points],'o':[[0,0] for _ in points],'c':closed}
def parse(d):
 toks=re.findall(r'[MLHVCSQZmlhvcsqz]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?',d)
 i=0;paths=[];p=None;cur=[0,0];cmd=None
 while i<len(toks):
  if toks[i].isalpha():cmd=toks[i];i+=1
  else:assert cmd
  upper=cmd.upper();rel=cmd.islower()
  if upper=='Z':
   p['c']=True;cur=p['v'][0][:];p=None;cmd=None;continue
  arity={'M':2,'L':2,'H':1,'V':1,'C':6}[upper];nums=list(map(float,toks[i:i+arity]));i+=arity
  if upper in ('M','L'):end=nums
  elif upper=='H':end=[nums[0],cur[1]]
  elif upper=='V':end=[cur[0],nums[0]]
  elif upper=='C':end=nums[4:6]
  if rel:
   if upper=='H':end=[nums[0]+cur[0],cur[1]]
   elif upper=='V':end=[cur[0],nums[0]+cur[1]]
   else:end=[end[0]+cur[0],end[1]+cur[1]]
  if upper=='M':
   p=shape([end],False);paths.append(p);cmd='l' if rel else 'L'
  else:
   if upper=='C':
    c1=nums[:2];c2=nums[2:4]
    if rel:c1=[c1[0]+cur[0],c1[1]+cur[1]];c2=[c2[0]+cur[0],c2[1]+cur[1]]
    p['o'][-1]=[c1[j]-cur[j] for j in (0,1)]
    incoming=[c2[j]-end[j] for j in (0,1)]
   else:incoming=[0,0]
   p['v'].append(end);p['i'].append(incoming);p['o'].append([0,0])
  cur=end[:]
 return paths
def rgb(c):return [int(c[i:i+2],16)/255 for i in (1,3,5)]+[1]
def tr():return {'ty':'tr','p':V([0,0]),'a':V([0,0]),'s':V([100,100]),'r':V(0),'o':V(100),'sk':V(0),'sa':V(0)}
def grp(name,paths,fill=None,stroke=None,width=1):
 a=[{'ty':'sh','nm':name+' path '+str(i),'ks':V(p)} for i,p in enumerate(paths)]
 if fill:a.append({'ty':'fl','c':V(rgb(fill)),'o':V(100),'r':1})
 if stroke:a.append({'ty':'st','c':V(rgb(stroke)),'o':V(100),'w':V(width),'lc':1,'lj':2,'ml':4})
 return {'ty':'gr','nm':name,'it':a+[tr()]}
def getgroups(name):
 root=ET.parse(out/'originals'/f'{name}.svg').getroot();groups=[]
 for el in root.iter('{http://www.w3.org/2000/svg}path'):
  groups.append(grp(el.get('id'),parse(el.get('d')),el.get('fill'),el.get('stroke')))
 return groups
G={n:getgroups(n) for n in ('folder','system')}
def layer(name,groups,position=None,opacity=None):
 return {'ddd':0,'ty':4,'nm':name,'sr':1,'ks':{'p':position or V([32,32,0]),'a':V([0,0,0]),'s':V([100,100,100]),'r':V(0),'o':opacity or V(100)},'shapes':groups,'ip':0,'op':END,'st':0,'bm':0}
def original(name):return layer('Original exact SVG paths',list(reversed(copy.deepcopy(G[name]))))
def anim(n,ls):return {'v':'5.7.4','fr':60,'ip':0,'op':END,'w':128,'h':128,'nm':n,'ddd':0,'assets':[],'layers':[dict(l,ind=i+1) for i,l in enumerate(ls)],'markers':[{'tm':0,'cm':'Original geometry','dr':16},{'tm':190,'cm':'Original geometry','dr':20}]}
def morph(group,fn,times):
 g=copy.deepcopy(group)
 for item in g['it']:
  if item['ty']!='sh':continue
  p=item['ks']['k'];frames=[]
  for t,amount in times:
   q=copy.deepcopy(p)
   for idx,pt in enumerate(p['v']):
    q['v'][idx]=fn(pt,amount)
    for tangent in ('i','o'):
     absolute=[pt[j]+p[tangent][idx][j] for j in (0,1)];new=fn(absolute,amount);q[tangent][idx]=[new[j]-q['v'][idx][j] for j in (0,1)]
   frames.append((t,[q]))
  item['ks']=kf(frames)
 return g
# Motion rig v3: articulated surfaces, source path segments, continuous flight.
import math

def source_paths(g):return [copy.deepcopy(it['ks']['k']) for it in g['it'] if it['ty']=='sh']
def subset_group(g,indices,name):
 a=copy.deepcopy(g);ps=[it for it in a['it'] if it['ty']=='sh'];styles=[it for it in a['it'] if it['ty']!='sh'];a['it']=[ps[i] for i in indices]+styles;a['nm']=name;return a

def hold(points):return {'a':1,'k':[{'t':t,'s':s,'h':1} for t,s in points]}
def sampled(fn,start=0,end=END-1):
 return {'a':1,'k':[{'t':t,'s':fn(t),'o':{'x':0,'y':0},'i':{'x':1,'y':1}} for t in range(start,end)]+[{'t':end,'s':fn(end)}]}
def smooth(u):return u*u*u*(u*(u*6-15)+10)
def segment(t,a,b):return max(0,min(1,(t-a)/(b-a)))
def motion(t,points):
 if t<=points[0][0]:return points[0][1]
 for (a,x),(b,y) in zip(points,points[1:]):
  if t<=b:return x+(y-x)*smooth(segment(t,a,b))
 return points[-1][1]
def dynamic_window(l,start,end):
 return l

def static_window(name,start,end):
 l=original(name);l['ks']['o']=hold([(0,[100]),(start,[0]),(end,[100]),(END-1,[100])]);return l

def roundrect(x,y,w,h,r=.8):
 k=.55228475
 p=shape([[x+r,y],[x+w-r,y],[x+w,y+r],[x+w,y+h-r],[x+w-r,y+h],[x+r,y+h],[x,y+h-r],[x,y+r]],True)
 p['o'][1]=[r*k,0];p['i'][2]=[0,-r*k];p['o'][3]=[0,r*k];p['i'][4]=[r*k,0]
 p['o'][5]=[-r*k,0];p['i'][6]=[0,r*k];p['o'][7]=[0,-r*k];p['i'][0]=[-r*k,0]
 return p

# FOLDER. The hinge is the entire bottom edge, and all front geometry uses
# the same affine projection. Rear outlines are behind the paper layers.
openkeys=[(0,0),(31,1),(77,1),(108,0),(239,0)]
def hinge(pt,a):
 x,y=pt;distance=51.75-y
 return [x+.14*distance*a,y+.24*distance*a]
front_indices=[0,1,5,6,12]
rear_indices=[i for i in range(17) if i not in front_indices and i not in (4,14)]
rear_contour=subset_group(G['folder'][2],rear_indices,'Exact rear contour')
rear_fill=grp('Back wall',[shape([[10,51.75],[10,12.75],[25.1028,12.75],[29.4179,17.1651],[52.4316,17.1651],[52.4316,51.75]],True)],'#1F2224')
rear_extension=grp('Hidden rear right edge',[shape([[52.4316,24.2536],[52.4316,51.75]],False)],None,'#788087')
front_fill=grp('Front material',[shape([[10,51.75],[17.911,24.75],[60.9407,24.75],[53.87,51.75]],True)],'#1F2224')
front=[subset_group(G['folder'][2],[4,14],'Fixed hinge and left rear edge'),morph(subset_group(G['folder'][2],front_indices,'Exact front contour'),hinge,openkeys),morph(G['folder'][1],hinge,openkeys),morph(front_fill,hinge,openkeys)]
frontlayer=dynamic_window(layer('Hinged front cover',front),20,174)
backlayer=dynamic_window(layer('Rear wall behind all papers',[rear_contour,rear_extension,rear_fill]),20,174)
papers=[]
for i,(x,y,w,h) in enumerate([(17.5,29,26,21),(23,29,25,21)]):
 paper=grp('Paper perimeter',[roundrect(x,y,w,h)],None,'#788087',1)
 material=grp('Paper material',[roundrect(x,y,w,h)],'#1F2224')
 lines=grp('Document information',[shape([[x+4,y+5],[x+w-5,y+5]],False),shape([[x+4,y+9],[x+w-8,y+9]],False),shape([[x+4,y+13],[x+w-6,y+13]],False)],None,'#565C61',1)
 l=layer(['Research sheet','Selected sheet'][i],[lines,paper,material])
 anchor=[x+w/2,y+h];l['ks']['a']=V(anchor+[0])
 delay=0 if i==0 else 5
 endup=19 if i==0 else 14
 sidemax=-2 if i==0 else 1.5
 rotmax=-4 if i==0 else 3
 up=[(0,0),(12+delay,0),(44+delay,endup),(52+delay,endup),(84+delay,0),(239,0)]
 side=[(0,0),(12+delay,0),(44+delay,sidemax),(52+delay,sidemax),(84+delay,0),(239,0)]
 rot=[(0,0),(12+delay,0),(44+delay,rotmax),(52+delay,rotmax),(84+delay,0),(239,0)]
 l['ks']['p']=sampled(lambda t,a=anchor,u=up,s=side:[32+a[0]+motion(t,s),32+a[1]-motion(t,u),0])
 l['ks']['r']=sampled(lambda t,r=rot:[motion(t,r)])
 dynamic_window(l,20,174);papers.append(l)
folder=anim('Folder / open and return',[frontlayer]+list(reversed(papers))+[backlayer])

# CUBES. Every visible source curve is retained as an actual vector segment.
# Newly exposed joining edges use the source's exact shared edge endpoints.
outer=source_paths(G['system'][2])[0]
inner=source_paths(G['system'][1])
def slice_path(p,lo,hi):
 q={k:copy.deepcopy(p[k][lo:hi+1]) for k in ('v','i','o')};q['c']=False;q['i'][0]=[0,0];q['o'][-1]=[0,0];return q

def close_with(p,points):
 q=copy.deepcopy(p)
 for pt in points:q['v'].append(pt);q['i'].append([0,0]);q['o'].append([0,0])
 q['c']=True;return q
# Exact original exposed curves, plus newly visible closing lines.
rigs=[
 ('Upper cube',slice_path(outer,0,7),[[44.4994,28.4194],[32.0001,35.7506],[19.5004,28.417]], [0,1,2],0,-11,100,137, {0:[19.5004,28.417],7:[44.4994,28.4194]}),
 ('Left cube',slice_path(outer,16,24),[[19.5004,28.417],[32.0001,35.7506],[31.9992,50.4162]], [5,8,9],-9,5.28,66,96, {0:[31.9992,50.4162],7:[19.5004,28.417],8:[19.5004,28.417]}),
 ('Right cube',slice_path(outer,7,16),[[31.9992,50.4162],[32.0001,35.7506],[44.4994,28.4194]], [7,10,11],9,5.28,81,111, {0:[44.4994,28.4194],1:[44.4994,28.4194],8:[31.9992,50.4162],9:[31.9992,50.4162]})
]
parts=[];contours=[]
for i,(name,perimeter,closing,edges,dx,dy,a,b,targets) in enumerate(rigs):
 def amount(t):
  if t<=30:return smooth(segment(t,0,30))
  if t<=96:return 1
  return 1-smooth(segment(t,96,126))
 def surface(t,perimeter=perimeter,targets=targets,fn=amount):
  q=copy.deepcopy(perimeter);blend=smooth(max(0,min(1,fn(t)*4)))
  for idx,target in targets.items():
   q['v'][idx]=[q['v'][idx][j]+(target[j]-q['v'][idx][j])*blend for j in (0,1)]
   q['i'][idx]=[v*(1-blend) for v in q['i'][idx]];q['o'][idx]=[v*(1-blend) for v in q['o'][idx]]
  return q
 fillgroup=grp('Original source material',[close_with(perimeter,closing)],'#1F2224')
 fillgroup['it'][0]['ks']=sampled(lambda t,surface=surface,closing=closing:[close_with(surface(t),closing)])
 outline=grp('Original exterior curves',[perimeter],None,'#788087')
 outline['it'][0]['ks']=sampled(lambda t,surface=surface:[surface(t)])
 # Shared inner edges are the exact original polylines, without connector tails.
 shared=[inner[j] for j in ([3,4] if i==0 else [3,6] if i==1 else [4,6])]
 seam=grp('Shared edges become outer contours',shared,None,'#565C61')
 def seamcolor(t,fn=amount):
  blend=smooth(max(0,min(1,fn(t)/.12)))
  dark=rgb('#565C61');light=rgb('#788087')
  return [dark[j]+(light[j]-dark[j])*blend for j in range(4)]
 for stroke in seam['it']:
  if stroke['ty']=='st':stroke['c']=sampled(seamcolor)
 geometry=[seam,grp('Exact original face edges',[inner[j] for j in edges],None,'#565C61'),fillgroup]
 l=layer(name,geometry);c=layer(name+' exterior',[outline])
 pos=sampled(lambda t,fn=amount,dx=dx,dy=dy:[32+dx*fn(t),32+dy*fn(t),0])
 for target in (l,c):target['ks']['p']=copy.deepcopy(pos);dynamic_window(target,20,155)
 parts.append(l);contours.append(c)
# At full separation the exact cube transitions into another volume.
def morphamount(t):return motion(t,[(0,0),(6,0),(28,1),(67,1),(95,0),(239,0)])
def blendshape(a,b,u):
 q=copy.deepcopy(a)
 for key in ('v','i','o'):q[key]=[[x+(y-x)*u for x,y in zip(pa,pb)] for pa,pb in zip(a[key],b[key])]
 return q
def circle6(cx,cy,r):
 q=shape([[cx+r*math.cos(-math.pi/2+k*math.pi/3),cy+r*math.sin(-math.pi/2+k*math.pi/3)] for k in range(6)],True)
 h=4/3*math.tan(math.pi/12)*r
 for k in range(6):
  a=-math.pi/2+k*math.pi/3;v=[-math.sin(a)*h,math.cos(a)*h];q['o'][k]=v;q['i'][k]=[-v[0],-v[1]]
 return q
def ellipse(cx,cy,rx,ry):
 q=shape([[cx,cy-ry],[cx+rx,cy],[cx,cy+ry],[cx-rx,cy]],True);k=.5522847498
 q['o']=[[rx*k,0],[0,ry*k],[-rx*k,0],[0,-ry*k]];q['i']=[[-rx*k,0],[0,-ry*k],[rx*k,0],[0,ry*k]];return q
morphlayers=[]
for idx,cx in [(1,19.5004),(2,44.4994)]:
 cy=43.083
 base=shape([[cx,cy-14.666],[cx+12.4997,cy-7.333],[cx+12.4997,cy+7.333],[cx,cy+14.666],[cx-12.4997,cy+7.333],[cx-12.4997,cy-7.333]],True)
 if idx==1:target=circle6(cx,cy,14)
 else:target=shape([[cx,cy-12],[cx+14,cy-12],[cx+7,cy+1.5],[cx,cy+15],[cx-7,cy+1.5],[cx-14,cy-12]],True)
 border=grp('Transforming silhouette',[base],None,'#788087')
 material=grp('Transforming material',[base],'#1F2224')
 for group in [border,material]:group['it'][0]['ks']=sampled(lambda t,a=base,b=target:[blendshape(a,b,morphamount(t))])
 # Morph every internal line geometrically; no crossfade.
 starts=[[[cx-12.4997,cy-7.333],[cx,cy]],[[cx+12.4997,cy-7.333],[cx,cy]],[[cx,cy],[cx,cy+14.666]]]
 if idx==1:
  junction=[cx+4,cy+3]
  details=[shape([[cx-14*math.sqrt(3)/2,cy-7],junction],False),shape([[cx+14*math.sqrt(3)/2,cy-7],junction],False),shape([junction,[cx,cy+14]],False)]
  details[0]['o'][0]=[1,7];details[0]['i'][1]=[-7,2]
  details[1]['o'][0]=[-1,5];details[1]['i'][1]=[5,-1]
  details[2]['o'][0]=[-1,6];details[2]['i'][1]=[4,-1]
 else:details=[shape([[cx-14,cy-12],[cx+2,cy-3]],False),shape([[cx+14,cy-12],[cx+2,cy-3]],False),shape([[cx+2,cy-3],[cx,cy+15]],False)]
 detail=grp('Morphing volume lines',details,None,'#565C61')
 for item,ends,targetpath in zip([it for it in detail['it'] if it['ty']=='sh'],starts,details):
  n=len(targetpath['v']);source=shape([[ends[0][j]+(ends[1][j]-ends[0][j])*k/(n-1) for j in (0,1)] for k in range(n)],False)
  item['ks']=sampled(lambda t,a=source,b=targetpath:[blendshape(a,b,morphamount(t))])
 visible=hold([(0,[0]),(6,[100]),(96,[0]),(239,[0])])
 l=layer('Sphere' if idx==1 else 'Triangular pyramid',[border,detail,material],position=copy.deepcopy(parts[idx]['ks']['p']),opacity=visible)
 morphlayers.append(l)
 for old in (parts[idx],contours[idx]):old['ks']['o']=hold([(0,[100]),(6,[0]),(96,[100]),(239,[100])])
system=anim('System / cube, sphere, pyramid',morphlayers+contours+parts)

# ROCKET: exact Figma SVG path endpoints, no tracing or silhouette substitutions.
# Nodes 4631:886557 (rest) and 4627:886504 (hover), both native64x64.
def readrocket(filename):
 root=ET.parse(out/'originals'/filename).getroot()
 return [e for e in root.iter('{http://www.w3.org/2000/svg}path')]
rest=readrocket('rocket-rest.svg');hover=readrocket('rocket-hover.svg')
assert len(rest)==6 and len(hover)==7
progress=lambda t:motion(t,[(0,0),(30,1),(42,1),(72,0),(239,0)])
def flame_at(t,endpath):
 u=progress(t)
 anchor=[22.0312,41.7074]
 # Exact corresponding nozzle points from the two original Figma states.
 delta=[(19.2767-24.51)*(1-u),(45.1726-39.2293)*(1-u)]
 width=u**.65
 def transform(v):
  axial=(-v[0]+v[1])/2
  lateral=(v[0]+v[1])/2
  return [-axial*u+lateral*width,axial*u+lateral*width]
 q=copy.deepcopy(endpath)
 q['v']=[[anchor[k]+delta[k]+transform([v[j]-anchor[j] for j in (0,1)])[k] for k in (0,1)] for v in endpath['v']]
 for key in ('i','o'):q[key]=[transform(v) for v in endpath[key]]
 return q
rocketlayers=[]
for index,h in enumerate(hover):
 endpaths=parse(h.get('d'));startpaths=parse(rest[index].get('d')) if index<6 else copy.deepcopy(endpaths)
 if index==6:
  # Flame grows from the exhaust attachment point; no crossfade.
  for q in startpaths:
   q['v']=[[23.0,40.0] for _ in q['v']];q['i']=[[0,0] for _ in q['i']];q['o']=[[0,0] for _ in q['o']]
 assert len(startpaths)==len(endpaths)
 g=grp(h.get('id'),startpaths,h.get('fill'),h.get('stroke'),float(h.get('stroke-width','1')))
 for item,sp,ep in zip([it for it in g['it'] if it['ty']=='sh'],startpaths,endpaths):
  assert len(sp['v'])==len(ep['v'])
  item['ks']=sampled(lambda t,b=ep:[flame_at(t,b)]) if index==6 else sampled(lambda t,a=sp,b=ep:[blendshape(a,b,progress(t))])
 styles=[it for it in g['it'] if it['ty'] in ('st','fl')]
 for it in styles:
  if it['ty']=='st':
   sw=float(rest[index].get('stroke-width','1')) if index<6 else 0
   ew=float(h.get('stroke-width','1'))
   it['w']=sampled(lambda t,a=sw,b=ew:[a+(b-a)*progress(t)])
   it['lj']=1
  elif h.get('fill-rule')=='evenodd':it['r']=2
 # Lottie front-to-back order: stroke then fill, matching SVG stroke-over-fill.
 g['it']=[it for it in g['it'] if it['ty']=='sh']+[it for it in styles if it['ty']=='st']+[it for it in styles if it['ty']=='fl']+[tr()]
 if index==6:rocketlayers.append(layer('Figma flame / grows outward with nozzle clearance',[g]))
 else:rocketlayers.insert(0,layer('Figma '+h.get('id'),[g]))
rocketanim=anim('Rocket / exact Figma rest and hover',rocketlayers)
(out/'rocket.svg').write_bytes((out/'originals/rocket-rest.svg').read_bytes())
(out/'rocket-hover.svg').write_bytes((out/'originals/rocket-hover.svg').read_bytes())

def compact(value):
 if isinstance(value,float):return value
 if isinstance(value,list):return [compact(x) for x in value]
 if isinstance(value,dict):
  d={k:compact(v) for k,v in value.items()}
  if d.get('a')==1 and isinstance(d.get('k'),list) and len(d['k'])>2:
   ks=d['k'];d['k']=[k for i,k in enumerate(ks) if i==0 or i==len(ks)-1 or not (ks[i-1].get('s')==k.get('s')==ks[i+1].get('s'))]
  return d
 return value

for name,data in [('folder',folder),('system',system),('rocket',rocketanim)]:
 duration={'folder':120,'system':138,'rocket':84}[name]
 data['op']=duration
 if name=='folder':data['fr']=80
 if name=='rocket':data['fr']=75
 for l in data['layers']:l['op']=duration
 data['markers']=[{'tm':{'folder':49,'system':30,'rocket':30}[name],'cm':'hover-hold','dr':0},{'tm':0,'cm':'Original at rest','dr':0},{'tm':duration-1,'cm':'Original at rest','dr':1}]

 (out/f'{name}.json').write_text(json.dumps(compact(data),ensure_ascii=False,separators=(',',':')))
print('Built folder80fps, system60fps, rocket75fps')
