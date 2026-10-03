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
 private var jumpP=false;private var attackP=false;private var dashP=false;private var skillP=false;private val owners=HashMap<Int,Int>();private val held=BooleanArray(4);private var w=0f;private var h=0f;private var br=60f;private val bx=FloatArray(4);private val by=FloatArray(4);private var joyId=-1;private var joyOx=0f;private var joyOy=0f;private var joyX=0f;private var joyY=0f;private val labels=arrayOf("ATK","JMP","DSH","SKL");private val paint=Paint(Paint.ANTI_ALIAS_FLAG)
 @Synchronized fun layout(w:Int,h:Int){this.w=w.toFloat();this.h=h.toFloat();br=h*.095f*scale;val cx=this.w-br*2.2f;val cy=this.h-br*2.2f;bx[0]=cx;by[0]=cy;bx[1]=cx-br*2.5f;by[1]=cy+br*.3f;bx[2]=cx-br*.3f;by[2]=cy-br*2.4f;bx[3]=cx-br*2.7f;by[3]=cy-br*2.1f}
 @Volatile private var padMove=0f;@Volatile private var padJump=false;private var stickX=0f;private var keyL=false;private var keyR=false;private var hatX=0f
 fun axis()=if(moveX!=0f)moveX else padMove;fun isJumpHeld()=jumpHeld||padJump
 private fun handles(k:Int)=k==KeyEvent.KEYCODE_BUTTON_A||k==KeyEvent.KEYCODE_BUTTON_X||k==KeyEvent.KEYCODE_BUTTON_B||k==KeyEvent.KEYCODE_BUTTON_Y||k==KeyEvent.KEYCODE_DPAD_LEFT||k==KeyEvent.KEYCODE_DPAD_RIGHT
 private fun updatePad(){padMove=(if(keyR)1f else 0f)-(if(keyL)1f else 0f);if(padMove==0f)padMove=if(hatX!=0f)hatX else stickX}
 @Synchronized fun onKey(e:KeyEvent):Boolean{if(!handles(e.keyCode))return false;val down=e.action==KeyEvent.ACTION_DOWN;if(down&&e.repeatCount>0)return true;when(e.keyCode){KeyEvent.KEYCODE_BUTTON_A->{if(down)jumpP=true;padJump=down};KeyEvent.KEYCODE_BUTTON_X->{if(down)attackP=true};KeyEvent.KEYCODE_BUTTON_B->{if(down)dashP=true};KeyEvent.KEYCODE_BUTTON_Y->{if(down)skillP=true};KeyEvent.KEYCODE_DPAD_LEFT->keyL=down;KeyEvent.KEYCODE_DPAD_RIGHT->keyR=down};updatePad();return true}
 @Synchronized fun onMotion(e:MotionEvent):Boolean{if((e.source and InputDevice.SOURCE_JOYSTICK)==0||e.actionMasked!=MotionEvent.ACTION_MOVE)return false;val x=e.getAxisValue(MotionEvent.AXIS_X);val hat=e.getAxisValue(MotionEvent.AXIS_HAT_X);stickX=if(abs(x)<.2f)0f else x;hatX=if(hat>.5f)1f else if(hat<-.5f)-1f else 0f;updatePad();return true}
 @Synchronized fun consumeJump()=jumpP.also{jumpP=false};@Synchronized fun consumeAttack()=attackP.also{attackP=false};@Synchronized fun consumeDash()=dashP.also{dashP=false};@Synchronized fun consumeSkill()=skillP.also{skillP=false}
 @Synchronized fun onTouch(e:MotionEvent){when(e.actionMasked){MotionEvent.ACTION_DOWN,MotionEvent.ACTION_POINTER_DOWN->{val i=e.actionIndex;down(e.getPointerId(i),e.getX(i),e.getY(i))};MotionEvent.ACTION_MOVE->for(i in 0 until e.pointerCount)if(e.getPointerId(i)==joyId)moveJoy(e.getX(i),e.getY(i));MotionEvent.ACTION_UP,MotionEvent.ACTION_POINTER_UP->up(e.getPointerId(e.actionIndex));MotionEvent.ACTION_CANCEL->releaseAll()}}
 private fun down(id:Int,x:Float,y:Float){var best=-1;var bd=Float.MAX_VALUE;for(i in 0..3){val d=hypot(x-bx[i],y-by[i]);if(d<br*1.25f&&d<bd){bd=d;best=i}};if(best>=0){owners[id]=best;held[best]=true;when(best){0->attackP=true;1->{jumpP=true;jumpHeld=true};2->dashP=true;3->skillP=true};return};if(x<w*.45f&&joyId==-1){joyId=id;joyOx=x;joyOy=y;joyX=x;joyY=y;moveX=0f}}
 private fun moveJoy(x:Float,y:Float){joyX=x;joyY=y;val v=((x-joyOx)/(br*1.6f)).coerceIn(-1f,1f);moveX=if(abs(v)<.2f)0f else v}
 private fun up(id:Int){if(id==joyId){joyId=-1;moveX=0f;return};val b=owners.remove(id);if(b!=null){held[b]=false;if(b==1)jumpHeld=false}}
 @Synchronized fun releaseAll(){owners.clear();held.fill(false);joyId=-1;moveX=0f;jumpHeld=false;jumpP=false;attackP=false;dashP=false;skillP=false;stickX=0f;keyL=false;keyR=false;hatX=0f;padMove=0f;padJump=false}
 @Synchronized fun clearPressed(){jumpP=false;attackP=false;dashP=false;skillP=false}
 @Synchronized fun draw(c:Canvas){val a=(opacity*255).toInt();val jr=br*1.6f;val ox=if(joyId!=-1)joyOx else w*.15f;val oy=if(joyId!=-1)joyOy else h*.72f;paint.style=Paint.Style.STROKE;paint.strokeWidth=4f;paint.color=0xFFBFE8FF.toInt();paint.alpha=a;c.drawCircle(ox,oy,jr,paint);paint.style=Paint.Style.FILL;val kx=if(joyId!=-1)ox+(joyX-ox).coerceIn(-jr,jr)else ox;val ky=if(joyId!=-1)oy+(joyY-oy).coerceIn(-jr,jr)else oy;c.drawCircle(kx,ky,br*.6f,paint);paint.textAlign=Paint.Align.CENTER;paint.textSize=br*.5f;for(i in 0..3){paint.color=if(held[i])0xFF8FE3FF.toInt()else 0xFF3A5A8C.toInt();paint.alpha=a;c.drawCircle(bx[i],by[i],br,paint);paint.color=0xFFFFFFFF.toInt();paint.alpha=255;c.drawText(labels[i],bx[i],by[i]+br*.18f,paint)}}
}
