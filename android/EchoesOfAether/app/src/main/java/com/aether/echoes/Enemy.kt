package com.aether.echoes
import kotlin.math.abs
import kotlin.math.floor
import kotlin.math.min
enum class EState{PATROL,CHASE,ATTACK,RECOVER,HIT,DEAD}
class Enemy(val id:Int,sx:Float,sy:Float):Body(sx,sy-40f,34f,40f){
 var hp=30;val armor=2;var state=EState.PATROL;var timer=0f;var flash=0f;var deadT=0f;var dir=1;var lastSwing=-1;var attackHit=false;private var stuckT=0f;private var lastX=sx
 private fun groundAhead(w:World)=w.solid(floor((x+this.w/2+dir*(this.w/2+6))/T).toInt(),floor((y+h+4)/T).toInt())
 fun hurt(g:Game,dmg:Int,fromDir:Int){hp-=dmg;flash=.1f;if(hp<=0){state=EState.DEAD;deadT=.3f;vx=0f;return};state=EState.HIT;timer=.25f;vx=fromDir*220f;vy=-200f}
 fun update(g:Game,dt:Float){val p=g.player;val dx=(p.x+p.w/2)-(x+w/2);val dy=(p.y+p.h/2)-(y+h/2);timer-=dt;flash-=dt;when(state){EState.PATROL->{vx=dir*70f;if(hitWall!=0||!groundAhead(g.world))dir=-dir;if(abs(dx)<220&&abs(dy)<90&&!p.dead){state=EState.CHASE;stuckT=0f}};EState.CHASE->{dir=if(dx>0)1 else -1;vx=if(!groundAhead(g.world)||hitWall!=0)0f else dir*130f;if(abs(dx)<44&&abs(dy)<60){state=EState.ATTACK;timer=.45f;attackHit=false;vx=0f}else if(abs(dx)>340||p.dead)state=EState.PATROL;if(abs(x-lastX)<.5f)stuckT+=dt else{stuckT=0f;lastX=x};if(stuckT>1.2){state=EState.PATROL;dir=-dir;stuckT=0f}};EState.ATTACK->{vx=0f;if(!attackHit&&timer<=.05f){attackHit=true;if(abs(dx)<58&&abs(dy)<60)p.hurt(g,12,x)};if(timer<=0){state=EState.RECOVER;timer=.5f}};EState.RECOVER->{vx=0f;if(timer<=0)state=EState.CHASE};EState.HIT->{vx=approach(vx,0f,600f*dt);if(timer<=0)state=EState.CHASE};EState.DEAD->{vx=0f;deadT-=dt}};vy=min(vy+2200f*dt,900f);move(g.world,dt)}
}
