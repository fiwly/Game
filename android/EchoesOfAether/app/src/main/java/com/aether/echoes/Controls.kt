package com.aether.echoes
import android.graphics.Canvas
import android.graphics.Paint
import android.view.InputDevice
import android.view.KeyEvent
import android.view.MotionEvent
import kotlin.math.abs
import kotlin.math.hypot
class Controls{
 @Volatile var moveX=0f;@Volatile var jumpHeld=false;var scale=1f;var opacity=.55f
 private var jp=false;private var ap=false;private var dp=false;private var sp=false
 private var left=false;private var right=false;private var stick=0f;private var hat=0f;private var joy=-1;private var ox=0f;private var oy=0f;private var jx=0f;private var jy=0f
 private val owners=HashMap<Int,Int>();private val held=BooleanArray(4);private val bx=FloatArray(4);private val by=FloatArray(4);private var w=0f;private var h=0f;private var br=60f;private val p=Paint(3);private val labels=arrayOf("ATK","JMP","DSH","SKL")
 @Synchronized fun layout(w:Int,h:Int){this.w=w.toFloat();this.h=h.toFloat();br=h*.095f*scale;val x=this.w-br*2.2f;val y=this.h-br*2.2f;bx[0]=x;by[0]=y;bx[1]=x-br*2.5f;by[1]=y+br*.3f;bx[2]=x-br*.3f;by[2]=y-br*2.4f;bx[3]=x-br*2.7f;by[3]=y-br*2.1f}
 private fun pad(){moveX=if(left&&!right)-1f else if(right&&!left)1f else if(hat!=0f)hat else stick}
 fun axis()=if(moveX!=0f)moveX else 0f;fun isJumpHeld()=jumpHeld
 @Synchronized fun onKey(e:KeyEvent):Boolean{val d=e.action==KeyEvent.ACTION_DOWN;if(d&&e.repeatCount>0)return true;when(e.keyCode){KeyEvent.KEYCODE_BUTTON_A->{if(d)jp=true;jumpHeld=d;return true};KeyEvent.KEYCODE_BUTTON_X->{if(d)ap=true;return true};KeyEvent.KEYCODE_BUTTON_B->{if(d)dp=true;return true};KeyEvent.KEYCODE_BUTTON_Y->{if(d)sp=true;return true};KeyEvent.KEYCODE_DPAD_LEFT->{left=d;pad();return true};KeyEvent.KEYCODE_DPAD_RIGHT->{right=d;pad();return true}};return false}
 @Synchronized fun onMotion(e:MotionEvent):Boolean{if((e.source and InputDevice.SOURCE_JOYSTICK)==0||e.actionMasked!=MotionEvent.ACTION_MOVE)return false;val x=e.getAxisValue(MotionEvent.AXIS_X);val z=e.getAxisValue(MotionEvent.AXIS_HAT_X);stick=if(abs(x)<.2f)0f else x;hat=if(z>.5f)1f else if(z<-.5f)-1f else 0f;pad();return true}
 fun consumeJump()=jp.also{jp=false};fun consumeAttack()=ap.also{ap=false};fun consumeDash()=dp.also{dp=false};fun consumeSkill()=sp.also{sp=false}
 @Synchronized fun onTouch(e:MotionEvent){when(e.actionMasked){MotionEvent.ACTION_DOWN,MotionEvent.ACTION_POINTER_DOWN->{val i=e.actionIndex;down(e.getPointerId(i),e.getX(i),e.getY(i))};MotionEvent.ACTION_MOVE->for(i in 0 until e.pointerCount)if(e.getPointerId(i)==joy)joyMove(e.getX(i),e.getY(i));MotionEvent.ACTION_UP,MotionEvent.ACTION_POINTER_UP->up(e.getPointerId(e.actionIndex));MotionEvent.ACTION_CANCEL->releaseAll()}}
 private fun down(id:Int,x:Float,y:Float){var b=-1;var bd=Float.MAX_VALUE;for(i in 0..3){val q=hypot(x-bx[i],y-by[i]);if(q<br*1.25f&&q<bd){bd=q;b=i}};if(b>=0){owners[id]=b;held[b]=true;when(b){0->ap=true;1->{jp=true;jumpHeld=true};2->dp=true;3->sp=true};return};if(x<w*.45f&&joy<0){joy=id;ox=x;oy=y;jx=x;jy=y;moveX=0f}}
 private fun joyMove(x:Float,y:Float){jx=x;jy=y;val v=((x-ox)/(br*1.6f)).coerceIn(-1f,1f);moveX=if(abs(v)<.2f)0f else v}
 private fun up(id:Int){if(id==joy){joy=-1;moveX=0f;return};owners.remove(id)?.let{b->held[b]=false;if(b==1)jumpHeld=false}}
 @Synchronized fun releaseAll(){owners.clear();held.fill(false);joy=-1;moveX=0f;jumpHeld=false;jp=false;ap=false;dp=false;sp=false;left=false;right=false;stick=0f;hat=0f}
 @Synchronized fun clearPressed(){jp=false;ap=false;dp=false;sp=false}
 fun draw(c:Canvas){val a=(opacity*255).toInt();val jr=br*1.6f;val x=if(joy>=0)ox else w*.15f;val y=if(joy>=0)oy else h*.72f;p.style=Paint.Style.STROKE;p.strokeWidth=4f;p.color=0xFFBFE8FF.toInt();p.alpha=a;c.drawCircle(x,y,jr,p);p.style=Paint.Style.FILL;val kx=if(joy>=0)x+(jx-x).coerceIn(-jr,jr)else x;val ky=if(joy>=0)y+(jy-y).coerceIn(-jr,jr)else y;c.drawCircle(kx,ky,br*.6f,p);p.textAlign=Paint.Align.CENTER;p.textSize=br*.5f;for(i in 0..3){p.color=if(held[i])0xFF8FE3FF.toInt()else 0xFF3A5A8C.toInt();p.alpha=a;c.drawCircle(bx[i],by[i],br,p);p.color=0xFFFFFFFF.toInt();p.alpha=255;c.drawText(labels[i],bx[i],by[i]+br*.18f,p)}}
}