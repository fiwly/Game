import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

/* NEON QUEST 3D
   Original procedural 3D assets. No third-party game assets.
   Three.js provides the WebGL renderer and scene graph. */
const $=id=>document.getElementById(id);
const SAVE_KEY="neonQuest3D_v1";
const WORLD={w:92,d:62};
const HERO={name:"Knight",maxHp:120,damage:22,speed:7,crit:.12};
const defaults={coins:0,xp:0,level:1,damage:0,hp:0,speed:0,skill:0,chapter:1,kills:0};
let save=loadSave();
let scene,camera,renderer,clock,player;
let enemies=[],projectiles=[],loot=[],effects=[],decor=[];
let started=false,paused=false,dead=false,victory=false;
let attackCd=0,skillCd=0,dodgeCd=0,dodgeTime=0,invuln=0,hitFlash=0;
let questKills=0, bossSpawned=false, boss=null;
let move={x:0,z:0},keys={};
let joystickActive=false,joystickPointer=0,audioCtx=null;

function loadSave(){
  try{
    const v=JSON.parse(localStorage.getItem(SAVE_KEY));
    return v?{...defaults,...v}:structuredClone(defaults);
  }catch{return structuredClone(defaults)}
}
function saveGame(){localStorage.setItem(SAVE_KEY,JSON.stringify(save));updateUI()}
function xpNeed(){return 100+(save.level-1)*70}
function totalStats(){
  return {
    maxHp:HERO.maxHp+save.hp*20+(save.level-1)*8,
    damage:HERO.damage+save.damage*5+(save.level-1)*3,
    speed:HERO.speed+save.speed*.35,
    crit:HERO.crit+save.skill*.02
  }
}
function updateUI(){
  $("coins").textContent=save.coins;
  $("level").textContent="LV "+save.level;
  $("heroName").textContent=HERO.name;
  $("menuHeroName").textContent=HERO.name+" • LEVEL "+save.level;
  $("stats").innerHTML=`<div class="stat-grid">
    <div class="stat"><small>MAX HP</small><b>${totalStats().maxHp}</b></div>
    <div class="stat"><small>DAMAGE</small><b>${totalStats().damage}</b></div>
    <div class="stat"><small>SPEED</small><b>${totalStats().speed.toFixed(1)}</b></div>
  </div>`;
  $("equipment").innerHTML=`<div class="equip">⚔ <b>Ruinblade</b><br><small>Balanced starter weapon · +${totalStats().damage} base damage</small></div>`;
  renderShop();
}
function renderShop(){
  const items=[
    ["damage","Sharpened Edge","Damage +5",70],
    ["hp","Guardian Plate","Max HP +20",80],
    ["speed","Swift Boots","Move speed +0.35",90],
    ["skill","Arc Core","Skill power +2%",120]
  ];
  $("shop-items").innerHTML=items.map(([k,n,d,c])=>`<div class="shop-item"><h3>${n}</h3><p>${d} · Owned ${save[k]}</p><button data-buy="${k}" data-cost="${c}">BUY · ◈${c}</button></div>`).join("");
  document.querySelectorAll("[data-buy]").forEach(b=>b.onclick=()=>buy(b.dataset.buy,+b.dataset.cost));
}
function buy(k,cost){
  if(save.coins<cost){toast("Not enough coins");return}
  save.coins-=cost;save[k]++;saveGame();toast("Upgrade purchased");
  sound(520,.06,"triangle");
}
function gainXP(amount){
  save.xp+=amount;
  while(save.xp>=xpNeed()){
    save.xp-=xpNeed();save.level++;
    if(player){player.maxHp=totalStats().maxHp;player.hp=player.maxHp}
    toast("LEVEL UP · "+save.level);
    sound(880,.12,"sine");
  }
  saveGame();
}
function toast(msg){
  const el=$("toast");el.textContent=msg;el.classList.add("toast-show");
  clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove("toast-show"),1500);
}
function sound(freq,dur=.08,type="sine"){
  try{
    audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==="suspended")audioCtx.resume();
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(.035,audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+dur);
    o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur);
  }catch{}
}

function init(){
  scene=new THREE.Scene();
  scene.background=new THREE.Color(0x07101c);
  scene.fog=new THREE.FogExp2(0x07101c,.018);
  camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.1,220);
  renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
  renderer.setSize(innerWidth,innerHeight);
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  $("game").appendChild(renderer.domElement);

  const hemi=new THREE.HemisphereLight(0x9fb9ff,0x172015,1.7);scene.add(hemi);
  const moon=new THREE.DirectionalLight(0xb9d3ff,2.3);moon.position.set(-35,55,-25);moon.castShadow=true;
  moon.shadow.mapSize.set(1024,1024);moon.shadow.camera.left=-55;moon.shadow.camera.right=55;moon.shadow.camera.top=45;moon.shadow.camera.bottom=-45;scene.add(moon);
  const rim=new THREE.PointLight(0x6c5cff,25,35);rim.position.set(12,7,8);scene.add(rim);

  buildWorld();
  createPlayer();
  window.addEventListener("resize",resize);
  bindControls();
  updateUI();
  $("loading").classList.add("hidden");
  requestAnimationFrame(loop);
}
function mat(color,rough=.8,metal=0){
  return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
}
function mesh(geo,material,x,y,z){
  const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;
}
function buildWorld(){
  const ground=mesh(new THREE.PlaneGeometry(WORLD.w,WORLD.d),mat(0x17251d,.98),0,0,0);
  ground.rotation.x=-Math.PI/2;
  const path=mesh(new THREE.PlaneGeometry(9,WORLD.d-8),mat(0x2a2928,1),0,.012,0);path.rotation.x=-Math.PI/2;

  const water=mesh(new THREE.PlaneGeometry(19,12),new THREE.MeshStandardMaterial({color:0x123b4b,roughness:.2,metalness:.1,transparent:true,opacity:.8}),25,.02,-20);
  water.rotation.x=-Math.PI/2;

  for(let i=0;i<34;i++){
    const x=(Math.random()-.5)*82,z=(Math.random()-.5)*52;
    if(Math.abs(x)<7||z>20)continue;
    const tree=makeTree(x,z);decor.push(tree);
  }
  for(let i=0;i<18;i++){
    const x=-35+Math.random()*70,z=-22+Math.random()*38;
    const crystal=makeCrystal(x,z);decor.push(crystal);
  }
  makeRuin(-31,-2);makeRuin(30,2);
  makeGate(38,0);
  for(let i=0;i<14;i++){
    const rock=mesh(new THREE.DodecahedronGeometry(.5+Math.random()*.8,0),mat(0x35433e),-43+Math.random()*86,.35,-27+Math.random()*54);
    rock.scale.y=.55;decor.push(rock);
  }
}
function makeTree(x,z){
  const g=new THREE.Group();g.position.set(x,0,z);
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.25,.38,2.4,7),mat(0x3a2b22));trunk.position.y=1.2;trunk.castShadow=true;g.add(trunk);
  const crown=new THREE.Mesh(new THREE.DodecahedronGeometry(1.6,1),mat(0x1b513e));crown.position.y=2.9;crown.castShadow=true;g.add(crown);
  scene.add(g);return g;
}
function makeCrystal(x,z){
  const g=new THREE.Group();g.position.set(x,0,z);
  const m=new THREE.Mesh(new THREE.OctahedronGeometry(.55,0),mat(0x3e9ed0,.35,.4));m.position.y=.65;m.scale.y=1.7;m.castShadow=true;g.add(m);
  scene.add(g);return g;
}
function makeRuin(x,z){
  for(let i=0;i<7;i++){
    const h=2+Math.random()*3,w=.8+Math.random()*.7;
    const p=mesh(new THREE.BoxGeometry(w,h,w),mat(0x59615e),x+(Math.random()-.5)*7,h/2,z+(Math.random()-.5)*5);
    p.rotation.y=Math.random()*Math.PI;decor.push(p);
  }
}
function makeGate(x,z){
  const stone=mat(0x4d5354);
  [-3,3].forEach(px=>mesh(new THREE.BoxGeometry(1.4,7,1.4),stone,x+px,3.5,z));
  mesh(new THREE.BoxGeometry(7,1.5,1.4),stone,x,6.2,z);
  const glow=mesh(new THREE.BoxGeometry(4.8,.15,.15),mat(0x775cff,.3,.6),x,4.8,z-.8);
}
function createPlayer(){
  const g=new THREE.Group();g.position.set(-38,0,18);scene.add(g);
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.62,1.1,5,10),mat(0x2f4e78,.55,.35));body.position.y=1.15;body.castShadow=true;g.add(body);
  const head=new THREE.Mesh(new THREE.IcosahedronGeometry(.47,1),mat(0xc3d0db,.65,.15));head.position.y=2.05;head.castShadow=true;g.add(head);
  const cape=new THREE.Mesh(new THREE.ConeGeometry(.72,1.35,4,1,true),mat(0x201d42));cape.position.set(0,1.25,.48);cape.rotation.x=Math.PI;cape.castShadow=true;g.add(cape);
  const sword=new THREE.Mesh(new THREE.BoxGeometry(.13,1.5,.28),mat(0x9eeaff,.18,.75));sword.position.set(.75,1.2,.05);sword.rotation.z=-.5;sword.castShadow=true;g.add(sword);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.72,.025,8,32),new THREE.MeshBasicMaterial({color:0x55e6ff,transparent:true,opacity:.5}));ring.rotation.x=Math.PI/2;ring.position.y=.05;g.add(ring);
  player={group:g,hp:totalStats().maxHp,maxHp:totalStats().maxHp,attackAnim:0,dodgeDir:new THREE.Vector3()};
  camera.position.set(-42,15,30);camera.lookAt(g.position.x,1,g.position.z);
}
function spawnEnemy(type,x,z){
  const data={
    slime:{hp:45+save.level*8,speed:2.2,damage:7,reward:22,color:0x58d77b,scale:1},
    brute:{hp:90+save.level*15,speed:1.25,damage:14,reward:38,color:0xd66a5e,scale:1.25},
    archer:{hp:55+save.level*10,speed:1.7,damage:10,reward:32,color:0xb46cff,scale:1}
  }[type];
  const g=new THREE.Group();g.position.set(x,0,z);
  const core=new THREE.Mesh(new THREE.DodecahedronGeometry(.75*data.scale,1),mat(data.color,.65,.15));core.position.y=.9*data.scale;core.castShadow=true;g.add(core);
  const eye=new THREE.Mesh(new THREE.SphereGeometry(.12,8,8),mat(0xfff0bd,.25,.2));eye.position.set(0,1.05*data.scale,.68*data.scale);g.add(eye);
  const e={type,group:g,core,hp:data.hp,maxHp:data.hp,speed:data.speed,damage:data.damage,reward:data.reward,attackCd:Math.random()+.5,hit:0};
  scene.add(g);enemies.push(e);return e;
}
function spawnWave(){
  const spots=[[-18,-8],[-2,-17],[14,-10],[19,13],[-7,9]];
  const count=4+Math.min(3,save.level);
  for(let i=0;i<count;i++){
    const s=spots[Math.floor(Math.random()*spots.length)];
    const type=Math.random()<.55?"slime":Math.random()<.6?"archer":"brute";
    spawnEnemy(type,s[0]+(Math.random()-.5)*4,s[1]+(Math.random()-.5)*4);
  }
  questKills=0;
  $("questText").textContent="Defeat "+count+" corrupted guardians.";
}
function spawnBoss(){
  if(bossSpawned)return;
  bossSpawned=true;
  const g=new THREE.Group();g.position.set(31,0,0);
  const body=new THREE.Mesh(new THREE.DodecahedronGeometry(2.25,1),mat(0x4a315e,.5,.45));body.position.y=2.3;body.castShadow=true;g.add(body);
  const hornMat=mat(0x8c778e,.5,.25);
  for(const side of [-1,1]){const h=new THREE.Mesh(new THREE.ConeGeometry(.35,1.5,6),hornMat);h.position.set(side*1.15,4,0);h.rotation.z=side*.5;h.castShadow=true;g.add(h)}
  const eye=new THREE.Mesh(new THREE.SphereGeometry(.28,12,8),mat(0xff456b,.2,.4));eye.position.set(0,2.45,2.0);g.add(eye);
  const aura=new THREE.Mesh(new THREE.TorusGeometry(2.5,.07,8,48),new THREE.MeshBasicMaterial({color:0xff5577,transparent:true,opacity:.45}));aura.rotation.x=Math.PI/2;aura.position.y=.1;g.add(aura);
  scene.add(g);
  boss={group:g,hp:480+save.level*90,maxHp:480+save.level*90,attackCd:2,phase:1,slam:0};
  $("bossName").textContent="RUIN GUARDIAN";$("bossbar").classList.remove("hidden");updateBossUI();
  $("questTitle").textContent="The Ruin Guardian";$("questText").textContent="Defeat the Guardian.";
  toast("BOSS ARRIVED");sound(90,.35,"sawtooth");
}
function updateBossUI(){
  if(!boss)return;
  $("bossHp").style.width=Math.max(0,boss.hp/boss.maxHp*100)+"%";
  $("bossHpText").textContent=Math.ceil(Math.max(0,boss.hp))+" / "+boss.maxHp;
}
function clearEnemies(){
  enemies.forEach(e=>scene.remove(e.group));enemies=[];
  projectiles.forEach(p=>scene.remove(p.mesh));projectiles=[];
}
function beginAdventure(){
  started=true;paused=false;dead=false;victory=false;
  $("start-screen").classList.add("hidden");
  clearEnemies();questKills=0;bossSpawned=false;boss=null;
  $("bossbar").classList.add("hidden");
  player.group.position.set(-38,0,18);player.hp=totalStats().maxHp;
  spawnWave();toast("THE VALLEY AWAITS");sound(440,.1);
}
function damagePlayer(amount){
  if(invuln>0||dead)return;
  player.hp-=amount;hitFlash=.15;sound(120,.08,"square");
  if(player.hp<=0){player.hp=0;die()}
}
function die(){
  dead=true;paused=false;$("game-over").classList.remove("hidden");sound(70,.3,"sawtooth");
}
function finishVictory(){
  victory=true;paused=true;
  save.coins+=250;gainXP(220);save.chapter=2;saveGame();
  $("bossbar").classList.add("hidden");$("victory").classList.remove("hidden");sound(660,.2);setTimeout(()=>sound(990,.2),120);
}
function attack(){
  if(!started||paused||dead||attackCd>0||victory)return;
  attackCd=.38;player.attackAnim=.22;sound(190,.07,"square");
  let best=null,bestD=4.8;
  const forward=new THREE.Vector3(0,0,-1).applyQuaternion(player.group.quaternion);
  for(const e of enemies){
    const d=player.group.position.distanceTo(e.group.position);
    const dir=e.group.position.clone().sub(player.group.position).normalize();
    if(d<bestD&&forward.dot(dir)>.05){best=e;bestD=d}
  }
  if(boss){
    const d=player.group.position.distanceTo(boss.group.position);
    if(d<5.3){hitBoss(totalStats().damage);return}
  }
  if(best)hitEnemy(best,totalStats().damage);
}
function hitEnemy(e,dmg){
  const crit=Math.random()<totalStats().crit;dmg=Math.round(dmg*(crit?1.8:1));
  e.hp-=dmg;e.hit=.12;e.core.material.emissive=new THREE.Color(crit?0xffe56a:0x55e6ff);e.core.material.emissiveIntensity=crit?2:1;
  spawnBurst(e.group.position,crit?0xffd45a:0x55e6ff,crit?8:4);
  if(e.hp<=0){
    scene.remove(e.group);enemies=enemies.filter(x=>x!==e);
    save.coins+=e.reward;gainXP(25);questKills++;
    dropLoot(e.group.position);
    if(enemies.length===0){spawnBoss()}
    else if(questKills>=4){toast("AREA CLEARED");setTimeout(()=>spawnBoss(),500)}
  }
}
function hitBoss(dmg){
  const crit=Math.random()<totalStats().crit;dmg=Math.round(dmg*(crit?1.8:1));
  boss.hp-=dmg;spawnBurst(boss.group.position,crit?0xffd45a:0xff5577,10);sound(260,.05,"square");updateBossUI();
  if(boss.hp<=boss.maxHp*.5&&boss.phase===1){boss.phase=2;toast("GUARDIAN ENRAGED");sound(80,.2,"sawtooth")}
  if(boss.hp<=0){scene.remove(boss.group);boss=null;finishVictory()}
}
function skill(){
  if(!started||paused||dead||skillCd>0)return;
  skillCd=4.2;sound(520,.14,"sine");
  const radius=5.5;spawnBurst(player.group.position,0x9b6cff,26);
  for(const e of [...enemies])if(player.group.position.distanceTo(e.group.position)<radius)hitEnemy(e,Math.round(totalStats().damage*1.25));
  if(boss&&player.group.position.distanceTo(boss.group.position)<radius)hitBoss(Math.round(totalStats().damage*1.25));
  toast("ARC NOVA");
}
function dodge(){
  if(!started||paused||dead||dodgeCd>0)return;
  dodgeCd=1.1;dodgeTime=.28;invuln=.38;
  const d=new THREE.Vector3(move.x,0,move.z);
  if(d.lengthSq()<.1)d.set(0,0,-1).applyQuaternion(player.group.quaternion);
  player.dodgeDir.copy(d.normalize());sound(340,.06,"triangle");
}
function enemyAI(dt){
  for(const e of enemies){
    e.attackCd-=dt;e.hit=Math.max(0,e.hit-dt);
    const to=player.group.position.clone().sub(e.group.position);to.y=0;
    const dist=to.length();to.normalize();
    if(e.type==="archer"){
      if(dist>8)e.group.position.addScaledVector(to,e.speed*dt);
      else if(dist<5)e.group.position.addScaledVector(to,-e.speed*.7*dt);
      e.group.lookAt(player.group.position.x,e.group.position.y+.8,player.group.position.z);
      if(e.attackCd<=0&&dist<12){e.attackCd=2.2;shoot(e)}
    }else{
      if(dist>1.8)e.group.position.addScaledVector(to,e.speed*dt);
      else if(e.attackCd<=0){e.attackCd=e.type==="brute"?1.6:1.1;damagePlayer(e.damage)}
      e.group.lookAt(player.group.position.x,e.group.position.y+.7,player.group.position.z);
    }
    e.group.position.x=THREE.MathUtils.clamp(e.group.position.x,-44,44);e.group.position.z=THREE.MathUtils.clamp(e.group.position.z,-28,28);
    e.core.rotation.y+=dt*1.5;
    if(e.hit>0)e.core.scale.setScalar(1.18);else e.core.scale.setScalar(1);
  }
}
function shoot(e){
  const dir=player.group.position.clone().add(new THREE.Vector3(0,1,0)).sub(e.group.position).normalize();
  const meshP=new THREE.Mesh(new THREE.SphereGeometry(.16,8,8),mat(0xc37aff,.25,.4));
  meshP.position.copy(e.group.position).y=1;scene.add(meshP);
  projectiles.push({mesh:meshP,dir,speed:11,life:3,damage:e.damage});
}
function bossAI(dt){
  if(!boss)return;
  boss.attackCd-=dt;
  boss.group.rotation.y+=dt*.3;
  const to=player.group.position.clone().sub(boss.group.position);to.y=0;
  const dist=to.length();
  if(dist>5)boss.group.position.addScaledVector(to.normalize(),(boss.phase===2?1.35:.85)*dt);
  else if(boss.attackCd<=0){
    boss.attackCd=boss.phase===2?1.4:2.1;boss.slam=.55;
    spawnBurst(boss.group.position,0xff5577,18);sound(75,.18,"sawtooth");
  }
  if(boss.slam>0){
    boss.slam-=dt;
    if(boss.slam<.15&&dist<5.8)damagePlayer(boss.phase===2?28:20);
  }
}
function updateProjectiles(dt){
  for(const p of [...projectiles]){
    p.life-=dt;p.mesh.position.addScaledVector(p.dir,p.speed*dt);
    if(p.life<=0||p.mesh.position.distanceTo(player.group.position)<1){
      if(p.life>0)damagePlayer(p.damage);
      scene.remove(p.mesh);projectiles=projectiles.filter(x=>x!==p);
    }
  }
}
function dropLoot(pos){
  if(Math.random()<.7){
    const g=new THREE.Group();g.position.copy(pos);g.position.y=.5;
    const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.28),mat(0xffd45a,.25,.5));gem.castShadow=true;g.add(gem);scene.add(g);
    loot.push({group:g,value:8+Math.floor(Math.random()*15)});
  }
}
function updateLoot(dt){
  for(const l of [...loot]){
    l.group.rotation.y+=dt*2;l.group.position.y=.5+Math.sin(performance.now()*.004)*.08;
    if(l.group.position.distanceTo(player.group.position)<2){
      save.coins+=l.value;saveGame();toast("+"+l.value+" COINS");scene.remove(l.group);loot=loot.filter(x=>x!==l);sound(700,.05);
    }
  }
}
function spawnBurst(pos,color,count){
  for(let i=0;i<count;i++){
    const m=new THREE.Mesh(new THREE.SphereGeometry(.045+Math.random()*.07,5,5),new THREE.MeshBasicMaterial({color,transparent:true}));
    m.position.copy(pos);m.position.y+=.7;scene.add(m);
    effects.push({mesh:m,life:.35+Math.random()*.3,vel:new THREE.Vector3((Math.random()-.5)*5,Math.random()*4,(Math.random()-.5)*5)});
  }
}
function updateEffects(dt){
  for(const e of [...effects]){
    e.life-=dt;e.mesh.position.addScaledVector(e.vel,dt);e.vel.y-=7*dt;e.mesh.scale.multiplyScalar(.94);
    e.mesh.material.opacity=Math.max(0,e.life*2);
    if(e.life<=0){scene.remove(e.mesh);effects=effects.filter(x=>x!==e)}
  }
}
function updatePlayer(dt){
  const s=totalStats();
  let dir=new THREE.Vector3(move.x,0,move.z);
  if(dir.lengthSq()>1)dir.normalize();
  if(dodgeTime>0){
    dodgeTime-=dt;player.group.position.addScaledVector(player.dodgeDir,17*dt);
  }else{
    player.group.position.addScaledVector(dir,s.speed*dt);
    if(dir.lengthSq()>.02){const target=Math.atan2(dir.x,dir.z);player.group.rotation.y=THREE.MathUtils.lerp(player.group.rotation.y,target,1-Math.pow(.001,dt))}
  }
  player.group.position.x=THREE.MathUtils.clamp(player.group.position.x,-44,44);
  player.group.position.z=THREE.MathUtils.clamp(player.group.position.z,-28,28);
  attackCd=Math.max(0,attackCd-dt);skillCd=Math.max(0,skillCd-dt);dodgeCd=Math.max(0,dodgeCd-dt);invuln=Math.max(0,invuln-dt);
  player.attackAnim=Math.max(0,player.attackAnim-dt);hitFlash=Math.max(0,hitFlash-dt);
  const sword=player.group.children[3];if(sword)sword.rotation.z=-.5+(player.attackAnim>0?Math.sin((.22-player.attackAnim)/.22*Math.PI)*1.5:0);
  if(player.hp<player.maxHp&&enemies.length===0&&boss===null)player.hp=Math.min(player.maxHp,player.hp+dt*4);
}
function updateCamera(dt){
  const target=player.group.position.clone().add(new THREE.Vector3(0,1,0));
  const desired=target.clone().add(new THREE.Vector3(0,13,14));
  camera.position.lerp(desired,1-Math.pow(.001,dt));camera.lookAt(target);
}
function updateQuest(){
  $("hpBar").style.width=Math.max(0,player.hp/player.maxHp*100)+"%";
  $("xpBar").style.width=Math.max(0,save.xp/xpNeed()*100)+"%";
}
function animateDecor(dt){
  for(const d of decor)if(d.userData?.crystal)d.rotation.y+=dt;
}
function update(dt){
  if(!started||paused||dead||victory)return;
  updatePlayer(dt);enemyAI(dt);bossAI(dt);updateProjectiles(dt);updateLoot(dt);updateEffects(dt);updateCamera(dt);updateQuest();
  animateDecor(dt);
  if(player.group.position.x>27&&!bossSpawned&&enemies.length===0)spawnBoss();
}
function loop(t){
  const dt=Math.min(.033,(t-(clock?.last||t))/1000);if(clock)clock.last=t;else clock={last:t};
  update(dt);renderer.render(scene,camera);requestAnimationFrame(loop);
}
function resize(){
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);
}
function setMove(x,z){move.x=THREE.MathUtils.clamp(x,-1,1);move.z=THREE.MathUtils.clamp(z,-1,1)}
function bindControls(){
  $("start-game").onclick=()=>{sound(440,.1);beginAdventure()};
  $("retry").onclick=()=>{ $("game-over").classList.add("hidden");beginAdventure() };
  $("continue").onclick=()=>{ $("victory").classList.add("hidden");paused=false;started=true;bossSpawned=true;toast("CHAPTER 2 COMING · EXPLORE THE VALLEY") };
  $("pause").onclick=togglePause;$("resume").onclick=togglePause;
  $("open-menu").onclick=()=>{$("pause-screen").classList.add("hidden");$("menu").classList.remove("hidden")};
  $("close-menu").onclick=()=>{$("menu").classList.add("hidden");if(!dead&&!victory)paused=false};
  $("fullscreen").onclick=toggleFullscreen;
  $("attack").onpointerdown=e=>{e.preventDefault();attack()};$("skill").onpointerdown=e=>{e.preventDefault();skill()};$("dodge").onpointerdown=e=>{e.preventDefault();dodge()};
  $("reset-save").onclick=()=>{if(confirm("Reset all progress?")){localStorage.removeItem(SAVE_KEY);save=loadSave();updateUI();toast("Save reset")}};
  document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".tab-page").forEach(x=>x.classList.remove("active"));b.classList.add("active");$(b.dataset.tab).classList.add("active")});
  addEventListener("keydown",e=>{
    keys[e.key.toLowerCase()]=true;
    if([" ","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key))e.preventDefault();
    if(e.key==="j"||e.key==="Enter")attack();if(e.key==="k")skill();if(e.key===" ")dodge();if(e.key==="Escape")togglePause();
  });
  addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);
  renderer.domElement.addEventListener("pointerdown",e=>{if(e.pointerType==="mouse")attack()});
  bindJoystick();
}
function keyboardMove(){
  let x=0,z=0;if(keys.a||keys.arrowleft)x--;if(keys.d||keys.arrowright)x++;if(keys.w||keys.arrowup)z--;if(keys.s||keys.arrowdown)z++;
  if(x||z)setMove(x,z);else if(!joystickActive)setMove(0,0);
}
function bindJoystick(){
  const base=$("joystick"),stick=$("stick");
  base.addEventListener("pointerdown",e=>{joystickActive=true;joystickPointer=e.pointerId;base.setPointerCapture(e.pointerId);moveStick(e)});
  base.addEventListener("pointermove",e=>{if(e.pointerId===joystickPointer)moveStick(e)});
  base.addEventListener("pointerup",releaseStick);base.addEventListener("pointercancel",releaseStick);
  function moveStick(e){
    const r=base.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
    let dx=e.clientX-cx,dy=e.clientY-cy,max=r.width*.36;const len=Math.hypot(dx,dy);
    if(len>max){dx=dx/len*max;dy=dy/len*max}
    stick.style.transform=`translate(${dx}px,${dy}px)`;setMove(dx/max,dy/max);
  }
  function releaseStick(){joystickActive=false;stick.style.transform="translate(0,0)";setMove(0,0)}
  setInterval(keyboardMove,16);
}
async function toggleFullscreen(){
  try{
    if(!document.fullscreenElement)await document.documentElement.requestFullscreen?.();
    else await document.exitFullscreen?.();
  }catch{toast("Fullscreen is not available in this browser")}
}
function togglePause(){
  if(!started||dead||victory)return;
  paused=!paused;$("pause-screen").classList.toggle("hidden",!paused);
}
init();
