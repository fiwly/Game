package com.aether.echoes
import kotlin.math.floor
const val T = 48f
class World {
    data class Chapter(val id:Int,val name:String,val startCol:Int,val endCol:Int,val bossCol:Int)
    val chapters=listOf(Chapter(1,"The Awakening",0,79,72),Chapter(2,"Forgotten Ruins",80,159,152),Chapter(3,"Aether Caverns",160,239,232),Chapter(4,"Fallen City",240,319,312),Chapter(5,"Aether Tower",320,399,392),Chapter(6,"The Void",400,479,472),Chapter(7,"Heart of Aether",480,559,548))
    val cols=560; val rows=14; private val t=Array(rows){BooleanArray(cols)}
    val checkpoints=listOf(3f*T+T/2 to 12f*T,78f*T+T/2 to 12f*T,83f*T+T/2 to 12f*T,158f*T+T/2 to 12f*T,163f*T+T/2 to 12f*T,238f*T+T/2 to 12f*T,243f*T+T/2 to 12f*T,318f*T+T/2 to 12f*T,323f*T+T/2 to 12f*T,398f*T+T/2 to 12f*T,403f*T+T/2 to 12f*T,478f*T+T/2 to 12f*T,483f*T+T/2 to 12f*T,558f*T+T/2 to 12f*T)
    val enemySpawnCols=(0 until 7).flatMap{ch->listOf(12,28,48,63).map{it+ch*80}}
    val bossSpawnCols=chapters.map{it.bossCol}
    init{build()}
    private fun build(){for(x in 0 until cols)for(y in 12..13)t[y][x]=true;for(y in 0 until rows){t[y][0]=true;t[y][cols-1]=true};for(ch in chapters){val s=ch.startCol;for(x in s+10..s+15)t[9][x]=true;for(x in s+22..s+26)t[7][x]=true;for(x in s+34..s+37)t[5][x]=true;for(x in s+45..s+51)t[8][x]=true;for(y in 4..11){t[y][s+57]=true;t[y][s+61]=true};for(x in s+64..s+70)t[4][x]=true;for(y in 7..11){t[y][ch.bossCol-5]=true;t[y][ch.bossCol+5]=true};for(x in ch.bossCol-5..ch.bossCol+5)t[11][x]=true};for(y in 3..11){t[y][34]=true;t[y][35]=true;t[y][38]=true;t[y][39]=true};for(x in 40..46)t[3][x]=true;for(y in 10..11){t[y][34]=false;t[y][35]=false}}
    fun solid(tx:Int,ty:Int)=if(tx<0||tx>=cols)true else if(ty<0||ty>=rows)false else t[ty][tx]
    fun chapterAt(x:Float)=chapters.firstOrNull{x/T>=it.startCol&&x/T<=it.endCol}?:chapters.last()
    fun chapterIndexAt(x:Float)=chapterAt(x).id
    fun wallSide(b:Body):Int{val ty=floor((b.y+b.h/2)/T).toInt();if(solid(floor((b.x-2f)/T).toInt(),ty))return -1;if(solid(floor((b.x+b.w+2f)/T).toInt(),ty))return 1;return 0}
}
open class Body(var x:Float,var y:Float,val w:Float,val h:Float){var px=x;var py=y;var vx=0f;var vy=0f;var onGround=false;var hitWall=0;fun move(world:World,dt:Float){px=x;py=y;x+=vx*dt;hitWall=0;resolveX(world);y+=vy*dt;onGround=false;resolveY(world)};private fun resolveX(world:World){val ty0=floor(y/T).toInt();val ty1=floor((y+h-.01f)/T).toInt();val tx0=floor(x/T).toInt();val tx1=floor((x+w-.01f)/T).toInt();for(ty in ty0..ty1)for(tx in tx0..tx1)if(world.solid(tx,ty)){if(vx>0){x=tx*T-w;hitWall=1}else if(vx<0){x=(tx+1)*T;hitWall=-1};vx=0f;return}};private fun resolveY(world:World){val ty0=floor(y/T).toInt();val ty1=floor((y+h-.01f)/T).toInt();val tx0=floor(x/T).toInt();val tx1=floor((x+w-.01f)/T).toInt();for(ty in ty0..ty1)for(tx in tx0..tx1)if(world.solid(tx,ty)){if(vy>0){y=ty*T-h;onGround=true}else if(vy<0)y=(ty+1)*T;vy=0f;return}}}
