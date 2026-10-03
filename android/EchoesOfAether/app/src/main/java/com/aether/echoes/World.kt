package com.aether.echoes
import kotlin.math.floor
const val T=48f
class World{
 val cols=80;val rows=14;private val t=Array(rows){BooleanArray(cols)}
 val checkpoints=listOf(Pair(3f*T+T/2,12f*T),Pair(58f*T+T/2,12f*T));val enemySpawnCols=listOf(14,26,45,62,70)
 init{for(x in 0 until cols)for(y in 12..13)t[y][x]=true;for(x in 52..55)for(y in 12..13)t[y][x]=false;for(y in 0 until rows){t[y][0]=true;t[y][cols-1]=true};for(x in 10..14)t[9][x]=true;for(x in 16..19)t[7][x]=true;for(y in 3..11){for(x in 34..35)t[y][x]=true;for(x in 38..39)t[y][x]=true};for(x in 40..46)t[3][x]=true;for(y in 10..11)for(x in 34..35)t[y][x]=false}
 fun solid(tx:Int,ty:Int)=if(tx<0||tx>=cols)true else if(ty<0||ty>=rows)false else t[ty][tx]
 fun wallSide(b:Body):Int{val ty=floor((b.y+b.h/2)/T).toInt();if(solid(floor((b.x-2f)/T).toInt(),ty))return -1;if(solid(floor((b.x+b.w+2f)/T).toInt(),ty))return 1;return 0}
}
open class Body(var x:Float,var y:Float,val w:Float,val h:Float){var px=x;var py=y;var vx=0f;var vy=0f;var onGround=false;var hitWall=0
 fun move(world:World,dt:Float){px=x;py=y;x+=vx*dt;hitWall=0;resolveX(world);y+=vy*dt;onGround=false;resolveY(world)}
 private fun resolveX(world:World){val ty0=floor(y/T).toInt();val ty1=floor((y+h-.01f)/T).toInt();val tx0=floor(x/T).toInt();val tx1=floor((x+w-.01f)/T).toInt();for(ty in ty0..ty1)for(tx in tx0..tx1)if(world.solid(tx,ty)){if(vx>0){x=tx*T-w;hitWall=1}else if(vx<0){x=(tx+1)*T;hitWall=-1};vx=0f;return}}
 private fun resolveY(world:World){val ty0=floor(y/T).toInt();val ty1=floor((y+h-.01f)/T).toInt();val tx0=floor(x/T).toInt();val tx1=floor((x+w-.01f)/T).toInt();for(ty in ty0..ty1)for(tx in tx0..tx1)if(world.solid(tx,ty)){if(vy>0){y=ty*T-h;onGround=true}else if(vy<0)y=(ty+1)*T;vy=0f;return}}
}
