package com.aether.echoes
import android.app.Activity
import android.os.Bundle
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
class MainActivity:Activity(){
 private lateinit var game:Game;private lateinit var view:GameView
 override fun onCreate(b:Bundle?){super.onCreate(b);window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);game=Game(applicationContext);view=GameView(this,game);setContentView(view)}
 override fun onWindowFocusChanged(hasFocus:Boolean){super.onWindowFocusChanged(hasFocus);if(hasFocus)window.decorView.systemUiVisibility=View.SYSTEM_UI_FLAG_FULLSCREEN or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or View.SYSTEM_UI_FLAG_LAYOUT_STABLE else{game.paused=true;game.controls.releaseAll()}}
 override fun dispatchKeyEvent(e:KeyEvent):Boolean{if(e.keyCode==KeyEvent.KEYCODE_BUTTON_START){if(e.action==KeyEvent.ACTION_DOWN&&e.repeatCount==0)game.paused=!game.paused;return true};return game.controls.onKey(e)||super.dispatchKeyEvent(e)}
 override fun dispatchGenericMotionEvent(e:MotionEvent)=game.controls.onMotion(e)||super.dispatchGenericMotionEvent(e)
 override fun onPause(){super.onPause();game.paused=true;view.pauseLoop();game.controls.releaseAll();game.saveNow(true)}
 override fun onResume(){super.onResume();view.resumeLoop()}
 @Suppress("DEPRECATION","OVERRIDE_DEPRECATION")override fun onBackPressed(){if(game.paused)finish()else game.paused=true}
}