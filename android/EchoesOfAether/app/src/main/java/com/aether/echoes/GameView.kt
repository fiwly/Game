package com.aether.echoes
import android.content.Context
import android.view.MotionEvent
import android.view.SurfaceHolder
import android.view.SurfaceView
import kotlin.math.min

class GameView(ctx:Context,private val game:Game):SurfaceView(ctx),SurfaceHolder.Callback,Runnable{
 private var thread:Thread?=null;@Volatile private var running=false
 init{holder.addCallback(this);isFocusable=true}
 @Synchronized fun resumeLoop(){if(running)return;running=true;thread=Thread(this,"game-loop").also{it.start()}}
 @Synchronized fun pauseLoop(){running=false;thread?.join(500);thread=null}
 override fun run(){var last=System.nanoTime();var acc=0.0;val step=1.0/60.0;while(running){val now=System.nanoTime();acc+=min((now-last)/1e9,0.1);last=now;while(acc>=step){game.update(step.toFloat());acc-=step};if(holder.surface.isValid){val c=if(android.os.Build.VERSION.SDK_INT>=26)holder.lockHardwareCanvas() else holder.lockCanvas();if(c!=null){try{game.draw(c,c.width,c.height,(acc/step).toFloat().coerceIn(0f,1f))}finally{holder.unlockCanvasAndPost(c)}}};val waitMs=if(game.paused)50L else 0L;if(waitMs>0)try{Thread.sleep(waitMs)}catch(_:InterruptedException){}}}
 override fun onTouchEvent(e:MotionEvent):Boolean{if(e.actionMasked==MotionEvent.ACTION_DOWN){if(game.paused){game.paused=false;return true};if(e.x<width*.3f&&e.y<height*.12f){game.usePotion();return true}};game.controls.onTouch(e);return true}
 override fun surfaceCreated(h:SurfaceHolder){if(android.os.Build.VERSION.SDK_INT>=30)h.surface.setFrameRate(120f,android.view.Surface.FRAME_RATE_COMPATIBILITY_DEFAULT);resumeLoop()}
 override fun surfaceChanged(h:SurfaceHolder,f:Int,w:Int,hh:Int){}
 override fun surfaceDestroyed(h:SurfaceHolder){pauseLoop()}
}
