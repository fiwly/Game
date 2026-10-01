let THREE=null;
const THREE_SOURCES=[
 "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js",
 "https://unpkg.com/three@0.180.0/build/three.module.js"
];
async function loadThree(){
 let lastError=null;
 for(const src of THREE_SOURCES){
  try{
   THREE=await import(src);
   return true;
  }catch(error){
   lastError=error;
   console.warn("Three.js load failed:",src,error);
  }
 }
 console.error("Unable to load Three.js:",lastError);
 return false;
}

const $=id=>document.getElementById(id);
const saveKey="skybound_save_v1";
let scene,camera,renderer,clock,hero,locked=null;
let enemies=[],shots=[],fx=[],keys={},stick={x:0,y:0,active:false};
let running=false,paused=false,dead=false,won=false;
let stamina=100,combo=0,comboTimer=0,attackCD=0,heavyCD=0,dashCD=0,invuln=0;
let relic=false,shrineUsed=false,boss=null,interactTarget=null,relicObject=null,chests=[];
const defaultState={level:1,shards:0,relics:0};
let state={...defaultState};
try{
 const raw=localStorage.getItem(saveKey);
 if(raw){const parsed=JSON.parse(raw);if(parsed&&typeof parsed==="object")state={...defaultState,...parsed};}
}catch(e){console.warn("Save data unavailable:",e);}
function safeSaveData(){try{localStorage.setItem(saveKey,JSON.stringify(state));}catch(e){console.warn("Save unavailable:",e);}}
const world={size:110};

function save(){safeSaveData();$("shards").textContent=state.shards;$("level").textContent=state.level}
function material(c,r=.8,m=0){return new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m})}
function add(g){scene.add(g);return g}
function mesh(geo,mat,x,y,z){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m}
function dist(a,b){return a.position.distanceTo(b.position)}
function toast(t){$("prompt").textContent=t;clearTimeout(toast.t);toast.t=setTimeout(()=>{$("prompt").textContent=""},1800)}
function burst(p,color,n=8,power=4){for(let i=0;i<n;i++){const m=mesh(new THREE.SphereGeometry(.045+Math.random()*.07,5,5),new THREE.MeshBasicMaterial({color,transparent:true}));m.position.copy(p);fx.push({m,life:.35+Math.random()*.35,v:new THREE.Vector3((Math.random()-.5)*power,Math.random()*power,(Math.random()-.5)*power)})}}

function init(){
 try{
 scene=new THREE.Scene();scene.background=new THREE.Color(0x8ca69b);scene.fog=new THREE.Fog(0x8ca69b,48,125);
 camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,180);
 renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;
 $("game").appendChild(renderer.domElement);
 const hemi=new THREE.HemisphereLight(0xd9fff1,0x304038,2.2);add(hemi);
 const sun=new THREE.DirectionalLight(0xfff1c5,3);sun.position.set(-35,60,25);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-60;sun.shadow.camera.right=60;sun.shadow.camera.top=60;sun.shadow.camera.bottom=-60;add(sun);
 buildIsland();createHero();createShrine();createRelic();createChests();createEnemyCamp();bind();save();$("loading").classList.add("hidden");clock=new THREE.Clock();requestAnimationFrame(loop)
 }catch(error){
   console.error("SKYBOUND startup error:",error);
   $("loading")?.classList.add("hidden");
   const btn=$("startBtn");
   if(btn){btn.disabled=false;btn.textContent="RELOAD GAME";btn.onclick=()=>location.reload();}
 }
}

function buildIsland(){
 const ground=mesh(new THREE.CircleGeometry(55,64),material(0x405c4e,.98),0,-.3,0);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;
 for(let i=0;i<45;i++){const a=Math.random()*Math.PI*2,r=8+Math.random()*44,x=Math.cos(a)*r,z=Math.sin(a)*r; if(Math.hypot(x,z)<12)continue; makeTree(x,z)}
 for(let i=0;i<28;i++){const x=(Math.random()-.5)*90,z=(Math.random()-.5)*90;if(Math.hypot(x,z)<15)continue;const rock=mesh(new THREE.DodecahedronGeometry(.4+Math.random()*1.1,1),material(0x53635d),x,.4,z);rock.scale.y=.5+Math.random();rock.rotation.set(Math.random(),Math.random(),Math.random())}
 const water=mesh(new THREE.CircleGeometry(76,64),new THREE.MeshStandardMaterial({color:0x244b57,roughness:.2,metalness:.1,transparent:true,opacity:.78}),0,-1.1,0);water.rotation.x=-Math.PI/2;
 const path=mesh(new THREE.RingGeometry(7,9,48),material(0x706957),0,.01,0);path.rotation.x=-Math.PI/2;
 for(let i=0;i<12;i++){const a=i*Math.PI*2/12;const x=Math.cos(a)*10,z=Math.sin(a)*10;mesh(new THREE.CylinderGeometry(.5,.7,1.4,7),material(0x655e50),x,.7,z)}
 const ruins=new THREE.Group();ruins.position.set(28,0,-23);add(ruins);
 for(let i=0;i<8;i++){const p=new THREE.Mesh(new THREE.BoxGeometry(1.3,3+Math.random()*3,1.3),material(0x5e625e));p.position.set((Math.random()-.5)*10,1.5,(Math.random()-.5)*8);p.rotation.y=Math.random();p.castShadow=true;ruins.add(p)}
}
function makeTree(x,z){
 const g=new THREE.Group();g.position.set(x,0,z);const t=new THREE.Mesh(new THREE.CylinderGeometry(.18,.3,2.6,7),material(0x4c3829));t.position.y=1.3;t.castShadow=true;g.add(t);
 const c=new THREE.Mesh(new THREE.IcosahedronGeometry(1.35,1),material(0x244f40));c.position.y=2.9;c.castShadow=true;g.add(c);add(g)
}

function createHero(){
 const g=new THREE.Group();g.position.set(0,0,18);add(g);
 const body=new THREE.Mesh(new THREE.CapsuleGeometry(.55,1.1,5,10),material(0x355b62,.5,.25));body.position.y=1.05;body.castShadow=true;g.add(body);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.43,16,12),material(0xd3b28f));head.position.y=2;head.castShadow=true;g.add(head);
 const cloak=new THREE.Mesh(new THREE.ConeGeometry(.72,1.5,5,1,true),material(0x152d34));cloak.position.set(0,1.2,.35);cloak.rotation.x=Math.PI;cloak.castShadow=true;g.add(cloak);
 const sword=new THREE.Mesh(new THREE.BoxGeometry(.12,1.55,.3),material(0xd7e4df,.18,.75));sword.position.set(.7,1.15,0);sword.rotation.z=-.5;sword.castShadow=true;g.add(sword);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.7,.025,8,32),new THREE.MeshBasicMaterial({color:0xd6bd63}));ring.rotation.x=Math.PI/2;ring.position.y=.04;g.add(ring);
 hero={g,body,sword,hp:100,maxHp:100,anim:0};add(g)
}

function createShrine(){
 const g=new THREE.Group();g.position.set(0,0,-18);g.userData.type="shrine";add(g);
 const base=new THREE.Mesh(new THREE.CylinderGeometry(2.1,2.6,.7,8),material(0x6c6b60));base.position.y=.35;base.castShadow=true;g.add(base);
 const pillar=new THREE.Mesh(new THREE.CylinderGeometry(.6,.85,4,8),material(0x7b806e));pillar.position.y=2.3;pillar.castShadow=true;g.add(pillar);
 const orb=new THREE.Mesh(new THREE.IcosahedronGeometry(.75,2),new THREE.MeshStandardMaterial({color:0xd6bd63,emissive:0x6f5c1b,emissiveIntensity:1.8,roughness:.25,metalness:.5}));orb.position.y=4.7;orb.castShadow=true;g.add(orb);
 g.userData.action=()=>{if(!shrineUsed){shrineUsed=true;state.shards+=30;save();$("objective").textContent="Find the relic in the western ruins";$("objectiveText").textContent="The shrine revealed a path to the old ruins.";burst(g.position,0xd6bd63,25,6);toast("THE SHRINE AWAKENS")}else toast("The shrine is quiet.")};
}
function createRelic(){
 const g=new THREE.Group();g.position.set(28,0,-30);g.userData.type="relic";add(g);
 const base=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.5,.45,8),material(0x5d625b));base.position.y=.25;base.castShadow=true;g.add(base);
 const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.7,1),new THREE.MeshStandardMaterial({color:0xb7ffe9,emissive:0x3a8d79,emissiveIntensity:2,roughness:.2,metalness:.35}));crystal.position.y=1.25;crystal.castShadow=true;g.add(crystal);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(1,.035,8,32),new THREE.MeshBasicMaterial({color:0xd6bd63}));ring.rotation.x=Math.PI/2;ring.position.y=.8;g.add(ring);
 relicObject=g;
 g.userData.action=()=>{if(relic){toast("The relic is already yours");return}if(!shrineUsed){toast("The relic is sealed. Awaken the shrine first.");return}relic=true;state.relics++;state.shards+=50;save();$("objective").textContent="Clear the guardians";$("objectiveText").textContent="Defeat every guardian on the island. Then face the Warden.";burst(g.position,0xb7ffe9,28,6);toast("ANCIENT RELIC RECOVERED")};
}
function createChests(){
 for(const p of [[-27,-22],[34,-17],[-30,28]]){
  const g=new THREE.Group();g.position.set(p[0],0,p[1]);g.userData.type="chest";g.userData.open=false;add(g);
  const box=new THREE.Mesh(new THREE.BoxGeometry(1.6,.9,1.1),material(0x765536,.65,.2));box.position.y=.5;box.castShadow=true;g.add(box);
  const lid=new THREE.Mesh(new THREE.BoxGeometry(1.7,.45,1.15),material(0x9a6c3e,.6,.25));lid.position.y=1.15;lid.castShadow=true;g.add(lid);
  chests.push(g);
  g.userData.action=()=>{if(g.userData.open){toast("Empty chest");return}g.userData.open=true;lid.rotation.x=-1.05;state.shards+=20;save();burst(g.position,0xd6bd63,14,4);toast("+20 SHARDS")}
 }
}
function createEnemyCamp(){
 const spots=[[-18,-4],[-25,8],[19,-5],[30,13],[-12,30]];
 spots.forEach((p,i)=>spawnEnemy(i%2?"sentinel":"wraith",p[0],p[1]));
}

function spawnEnemy(type,x,z){
 const g=new THREE.Group();g.position.set(x,0,z);add(g);
 let hp=type==="wraith"?45:65;
 const core=new THREE.Mesh(type==="wraith"?new THREE.IcosahedronGeometry(.7,1):new THREE.DodecahedronGeometry(.75,1),material(type==="wraith"?0x6673c9:0x8b594f,.55,.2));core.position.y=1;core.castShadow=true;g.add(core);
 const eye=new THREE.Mesh(new THREE.SphereGeometry(.11,8,8),new THREE.MeshBasicMaterial({color:0xffe7a1}));eye.position.set(0,1.05,.68);g.add(eye);
 enemies.push({g,core,type,hp,maxHp:hp,attack:1.5+Math.random(),dead:false})
}

function spawnBoss(){
 if(boss)return;
 const g=new THREE.Group();g.position.set(31,0,-23);add(g);
 const body=new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.8,4.5,8),material(0x5a625d,.5,.45));body.position.y=2.25;body.castShadow=true;g.add(body);
 for(const x of [-1.7,1.7]){const h=new THREE.Mesh(new THREE.ConeGeometry(.45,2.2,6),material(0x887d68,.5,.3));h.position.set(x,4.7,0);h.rotation.z=x*.18;g.add(h)}
 const eye=new THREE.Mesh(new THREE.SphereGeometry(.32,12,8),new THREE.MeshBasicMaterial({color:0xff5f63}));eye.position.set(0,2.8,2.15);g.add(eye);
 boss={g,hp:420,maxHp:420,cd:2,phase:1};$("boss").classList.remove("hidden");$("bossName").textContent="STONE WARDEN";toast("THE WARDEN AWAKENS");burst(g.position,0xff5f63,30,6)
}

function nearestEnemy(){
 let best=null,d=7;for(const e of enemies){const x=dist(hero.g,e.g);if(x<d){d=x;best=e}}return best
}
function faceTarget(t){if(!t)return;const v=t.g.position.clone().sub(hero.g.position);hero.g.rotation.y=Math.atan2(v.x,v.z)}
function lightAttack(){
 if(!running||paused||dead||won||attackCD>0)return;
 attackCD=.25;combo=comboTimer>0?(combo%3)+1:1;comboTimer=.65;hero.anim=.25;const e=locked||nearestEnemy();if(e&&dist(hero.g,e.g)<4.2){faceTarget(e);hit(e,22+combo*7)}
}
function heavyAttack(){
 if(!running||paused||dead||won||heavyCD>0||stamina<25)return;
 heavyCD=1.2;stamina-=25;hero.anim=.45;const e=locked||nearestEnemy();burst(hero.g.position,0xd6bd63,12,3);
 for(const x of enemies.slice())if(dist(hero.g,x.g)<4.8)hit(x,42);
 if(boss&&dist(hero.g,boss.g)<5.5)hitBoss(55)
}
function hit(e,dmg){
 e.hp-=dmg;burst(e.g.position,0xe6d47a,7,3);e.core.scale.setScalar(1.2);setTimeout(()=>{if(e.core)e.core.scale.setScalar(1)},100);
 if(e.hp<=0){e.dead=true;if(locked===e){locked=null;$("lock").classList.remove("locked")}state.shards+=10;save();burst(e.g.position,0xb7ffe9,18,5);scene.remove(e.g);enemies=enemies.filter(x=>x!==e);toast("+10 SHARDS");if(enemies.length===0&&!boss&&relic)spawnBoss()}
}
function hitBoss(dmg){
 boss.hp-=dmg;burst(boss.g.position,0xff706d,12,4);updateBoss();
 if(boss.hp<boss.maxHp*.5&&boss.phase===1){boss.phase=2;toast("WARDEN ENRAGED")}
 if(boss.hp<=0){scene.remove(boss.g);boss=null;won=true;paused=true;state.relics++;state.shards+=100;save();$("boss").classList.add("hidden");$("win").classList.remove("hidden")}
}
function updateBoss(){if(!boss)return;$("bossHp").style.width=Math.max(0,boss.hp/boss.maxHp*100)+"%";$("bossText").textContent=Math.ceil(boss.hp)+" / "+boss.maxHp}

function dash(){
 if(!running||paused||dead||dashCD>0||stamina<30)return;dashCD=.8;stamina-=30;invuln=.42;
 let d=new THREE.Vector3(stick.x,0,stick.y);if(d.lengthSq()<.1)d.set(0,0,-1).applyQuaternion(hero.g.quaternion);hero.g.position.addScaledVector(d.normalize(),7);burst(hero.g.position,0xb7ffe9,8,2)
}
function move(dt){
 let x=stick.x,z=stick.y;if(keys.a||keys.arrowleft)x--;if(keys.d||keys.arrowright)x++;if(keys.w||keys.arrowup)z--;if(keys.s||keys.arrowdown)z++;
 const d=new THREE.Vector3(x,0,z);if(d.lengthSq()>1)d.normalize();
 hero.g.position.addScaledVector(d,6*dt);if(d.lengthSq()>.02)hero.g.rotation.y=THREE.MathUtils.lerp(hero.g.rotation.y,Math.atan2(d.x,d.z),.18);
 hero.g.position.x=THREE.MathUtils.clamp(hero.g.position.x,-48,48);hero.g.position.z=THREE.MathUtils.clamp(hero.g.position.z,-48,48);
 stamina=Math.min(100,stamina+18*dt);attackCD=Math.max(0,attackCD-dt);heavyCD=Math.max(0,heavyCD-dt);dashCD=Math.max(0,dashCD-dt);invuln=Math.max(0,invuln-dt);comboTimer=Math.max(0,comboTimer-dt)
}
function enemyAI(dt){
 for(const e of enemies){if(e.dead)continue;e.attack-=dt;const v=hero.g.position.clone().sub(e.g.position);v.y=0;const d=v.length();if(d>2)e.g.position.addScaledVector(v.normalize(),(e.type==="wraith"?1.9:1.4)*dt);else if(e.attack<=0&&invuln<=0){e.attack=e.type==="wraith"?1.5:1.9;hero.hp-=e.type==="wraith"?8:12;burst(hero.g.position,0xff5f63,5,2);if(hero.hp<=0)die()}e.g.lookAt(hero.g.position.x,1,hero.g.position.z);e.core.rotation.y+=dt*2}
}
function bossAI(dt){
 if(!boss)return;boss.cd-=dt;const v=hero.g.position.clone().sub(boss.g.position);v.y=0;const d=v.length();if(d>5)boss.g.position.addScaledVector(v.normalize(),(boss.phase===2?1.5:.9)*dt);if(d<6&&boss.cd<=0){boss.cd=boss.phase===2?1.2:2;burst(boss.g.position,0xff5f63,20,5);if(invuln<=0)hero.hp-=boss.phase===2?24:16;if(hero.hp<=0)die()}boss.g.rotation.y+=dt*.3;updateBoss()
}
function toggleLock(){
 if(!running||paused||dead)return;
 if(locked){locked=null;$("lock").classList.remove("locked");toast("LOCK-ON RELEASED");return}
 locked=nearestEnemy();
 if(locked){$("lock").classList.add("locked");toast("LOCKED ON")}
 else toast("NO TARGET IN RANGE")
}
function centerCamera(){
 if(!hero)return;
 const forward=new THREE.Vector3();camera.getWorldDirection(forward);forward.y=0;
 if(forward.lengthSq()>.01){forward.normalize();hero.g.rotation.y=Math.atan2(-forward.x,-forward.z)}
 toast("CAMERA CENTERED")
}
function interact(){
 if(!running||paused||dead)return;
 let best=null,d=4.5;scene.traverse(o=>{if(o.userData?.action){const x=dist(hero.g,o);if(x<d){d=x;best=o}}});if(best)best.userData.action();else toast("Nothing to interact with here")
}
function updateObjective(){
 if(!shrineUsed){$("objective").textContent="Find the ancient shrine";$("objectiveText").textContent="Walk north and investigate the glowing shrine."}
 else if(!relic){$("objective").textContent="Recover the lost relic";$("objectiveText").textContent="Search the old ruins for the glowing relic."}
 else {$("objective").textContent="Defeat the Stone Warden";$("objectiveText").textContent="The guardian protects the island's exit."}
}
function updateUI(){
 $("hp").style.width=Math.max(0,hero.hp/hero.maxHp*100)+"%";$("stamina").style.width=stamina+"%";$("shards").textContent=state.shards;$("level").textContent=state.level;updateObjective()
}
function die(){dead=true;paused=true;$("lose").classList.remove("hidden")}
function updateFX(dt){for(const f of fx.slice()){f.life-=dt;f.m.position.addScaledVector(f.v,dt);f.v.y-=8*dt;f.m.scale.multiplyScalar(.94);if(f.life<=0){scene.remove(f.m);fx=fx.filter(x=>x!==f)}}}
function updateCamera(dt){
 const target=hero.g.position.clone().add(new THREE.Vector3(0,1,0));const off=new THREE.Vector3(0,8,10).applyAxisAngle(new THREE.Vector3(0,1,0),hero.g.rotation.y);camera.position.lerp(target.clone().add(off),1-Math.pow(.001,dt));camera.lookAt(target)
}
function loop(){
 const dt=Math.min(.033,clock.getDelta());if(running&&!paused&&!dead&&!won){move(dt);enemyAI(dt);bossAI(dt);updateFX(dt);updateCamera(dt);updateUI()}
 renderer.render(scene,camera);requestAnimationFrame(loop)
}

function start(){
 running=true;paused=false;dead=false;won=false;relic=false;shrineUsed=false;locked=null;$("lock").classList.remove("locked");hero.hp=hero.maxHp;chests.forEach(c=>{c.userData.open=false;const lid=c.children[1];lid.rotation.set(0,0,0)});if(relicObject)relicObject.visible=true;hero.g.position.set(0,0,18);enemies.forEach(e=>scene.remove(e.g));enemies=[];boss=null;$("boss").classList.add("hidden");createEnemyCamp();$("start").classList.add("hidden");$("lose").classList.add("hidden");$("win").classList.add("hidden");toast("EXPEDITION STARTED")
}
function pause(){if(!running||dead||won)return;paused=!paused;$("pauseScreen").classList.toggle("hidden",!paused)}
function bind(){
 $("startBtn").onclick=start;$("retry").onclick=start;$("again").onclick=start;$("pause").onclick=pause;$("resume").onclick=pause;$("restart").onclick=start;$("fullscreen").onclick=async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen()}catch{}};
 $("light").onpointerdown=e=>{e.preventDefault();lightAttack()};$("heavy").onpointerdown=e=>{e.preventDefault();heavyAttack()};$("dash").onpointerdown=e=>{e.preventDefault();dash()};$("interact").onpointerdown=e=>{e.preventDefault();interact()};$("lock").onpointerdown=e=>{e.preventDefault();toggleLock()};$("center").onpointerdown=e=>{e.preventDefault();centerCamera()};
 addEventListener("keydown",e=>{keys[e.key.toLowerCase()]=true;if(e.key===" ")dash();if(e.key.toLowerCase()==="j"||e.key==="Enter")lightAttack();if(e.key.toLowerCase()==="k")heavyAttack();if(e.key.toLowerCase()==="e")interact();if(e.key.toLowerCase()==="f")toggleLock();if(e.key==="Escape")pause()});addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);
 renderer.domElement.addEventListener("pointerdown",e=>{if(e.pointerType==="mouse")lightAttack()});
 const z=$("stick-zone"),s=$("stick");let pid=null;
 z.onpointerdown=e=>{pid=e.pointerId;stick.active=true;z.setPointerCapture(pid);joy(e)};z.onpointermove=e=>{if(e.pointerId===pid)joy(e)};z.onpointerup=release;z.onpointercancel=release;
 function joy(e){const r=z.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),max=r.width*.35,l=Math.hypot(dx,dy);const q=l>max?max/l:1;stick.x=dx/max*q;stick.y=dy/max*q;s.style.transform=`translate(${dx*q}px,${dy*q}px)`}
 function release(){stick.active=false;stick.x=0;stick.y=0;s.style.transform="translate(0,0)"}
 addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)})
}

window.addEventListener("error",e=>console.error("SKYBOUND error:",e.error||e.message));
window.addEventListener("unhandledrejection",e=>console.error("SKYBOUND promise error:",e.reason));
loadThree().then(ok=>{
 if(ok) init();
 else{
  $("loading")?.classList.add("hidden");
  const btn=$("startBtn");
  if(btn){
   btn.disabled=false;
   btn.textContent="RELOAD GAME";
   btn.onclick=()=>location.reload();
  }
  const p=$("prompt");
  if(p) p.textContent="3D engine could not load. Tap RELOAD GAME.";
 }
});