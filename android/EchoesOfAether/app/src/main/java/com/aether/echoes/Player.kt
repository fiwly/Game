package com.aether.echoes
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sign
class Player:Body(0f,0f,28f,44f){
 var hp=100;var aether=100f;val maxAether=100;var facing=1;var coyote=0f;var jumpBuf=0f;var jumpLock=0f;var ctrlLock=0f;var extraJumps=0;var airDash=1;var dashT=0f;var dashCd=0f;var skillCd=0f;var atkT=0f;var atkCd=0f;var atkBuf=0f;var combo=0;var comboT=0f;var swingId=0;var invuln=0f;var dead=false;var wall=0;private var stepT=0f
 fun reset(spawnX:Float,spawnY:Float,g:Game){x=spawnX-w/2;y=spawnY-h;vx=0f;vy=0f;hp=g.maxHp();aether=maxAether.toFloat();invuln=1f;dead=false;dashT=0f;atkT=0f;ctrlLock=0f;this.px=x;this.py=y}
 fun update(g:Game,dt:Float){val c=g.controls;coyote-=dt;jumpBuf-=dt;jumpLock-=dt;ctrlLock-=dt;dashCd-=dt;skillCd-=dt;atkCd-=dt;atkBuf-=dt;comboT-=dt;invuln-=dt;if(c.consumeJump())jumpBuf=.12f;if(c.consumeAttack())atkBuf=.15f;val mx=c.axis();if(onGround){coyote=.1f;extraJumps=if("double_jump"in g.abilities)1 else 0;airDash=1};wall=if(!onGround&&"wall_jump"in g.abilities)g.world.wallSide(this)else 0
 if(c.consumeDash()&&dashCd<=0f&&"dash"in g.abilities&&(onGround||airDash>0)){if(!onGround)airDash--;g.audio.sfx("dash");dashT=.15f;dashCd=.45f;invuln=max(invuln,.18f);vx=facing*620f;vy=20f;g.particles.burst(x+w/2,y+h/2,8,0xFF9FE8FF.toInt())}
 if(dashT>0){dashT-=dt;vy=20f}else{if(ctrlLock<=0){if(abs(mx)>.2f)facing=if(mx>0)1 else -1;val slow=if(atkT>0&&onGround).35f else 1f;val target=mx*280f*slow;val speeding=abs(target)>abs(vx)&&(vx==0f||sign(target)==sign(vx));vx=approach(vx,target,(if(speeding)2600f else 3200f)*dt)};vy=min(vy+2200f*dt,900f);if(wall!=0&&vy>120&&mx*wall>.2f)vy=120f}
 if(jumpBuf>0&&dashT<=0){if(coyote>0){g.audio.sfx("jump");vy=-720f;coyote=0f;jumpBuf=0f;jumpLock=.1f;onGround=false}else if(wall!=0){g.audio.sfx("jump");vx=-wall*360f;vy=-680f;facing=-wall;ctrlLock=.18f;jumpBuf=0f;jumpLock=.1f}else if(extraJumps>0){g.audio.sfx("double_jump");vy=-640f;extraJumps--;jumpBuf=0f;jumpLock=.1f;g.particles.burst(x+w/2,y+h,6,0xFFFFFFFF.toInt())}}
 if(!c.isJumpHeld()&&jumpLock<=0&&vy<-300)vy=-300f
 if(atkBuf>0&&atkCd<=0&&dashT<=0){combo=if(comboT>0)(combo+1)%3 else 0;atkT=.16f;atkCd=if(combo==2).42f else .26f;comboT=.55f;atkBuf=0f;swingId++;g.audio.sfx(when(combo){0->"attack1";1->"attack2";else->"attack3"});vx+=facing*90f}
 if(atkT>0){atkT-=dt;g.playerStrike(this)}
 if(c.consumeSkill()&&aether>=20f&&skillCd<=0){aether-=20f;skillCd=.4f;g.audio.sfx("skill");g.fireBlast(x+w/2,y+h*.45f,facing)}
 aether=min(maxAether.toFloat(),aether+3f*dt);if(onGround&&abs(vx)>150&&dashT<=0){stepT-=dt;if(stepT<=0){stepT=.28f;g.audio.sfx("step",.6f)}}else stepT=0f;move(g.world,dt)}
 fun hurt(g:Game,dmg:Int,fromX:Float){if(invuln>0||dead)return;hp-=max(1,dmg-g.armor());invuln=.8f;ctrlLock=.15f;vx=if(x<fromX)-260f else 260f;vy=-320f;g.hitStop=.06f;g.addShake(8f);g.audio.sfx("player_hurt");if(hp<=0){hp=0;dead=true;g.audio.sfx("player_death")}}
}
