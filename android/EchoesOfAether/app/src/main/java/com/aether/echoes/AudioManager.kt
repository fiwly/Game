package com.aether.echoes
import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.SoundPool
class AudioManager(private val ctx:Context){
 private val names=arrayOf("jump","double_jump","dash","attack1","attack2","attack3","hit","crit","enemy_death","pickup","chest","potion","checkpoint","player_hurt","player_death","skill","levelup","step","ui_click")
 private val pool:SoundPool?=try{SoundPool.Builder().setMaxStreams(8).setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_GAME).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build()).build()}catch(_:Exception){null}
 private val ids=HashMap<String,Int>();@Volatile var master=1f;@Volatile var sfxVol=.9f;@Volatile var musicVol=.55f;@Volatile var muted=false;private var mp:MediaPlayer?=null;private var current:String?=null;private var wanted:String?=null;private var fade=0f;private var released=false
 init{pool?.let{p->for(n in names)try{ctx.assets.openFd("audio/sfx/$n.wav").use{ids[n]=p.load(it,1)}}catch(_:Exception){}}}
 fun sfx(name:String,gain:Float=1f){if(released||muted)return;val id=ids[name]?:return;val v=(gain*sfxVol*master).coerceIn(0f,1f);if(v>0)try{pool?.play(id,v,v,1,0,1f)}catch(_:Exception){}}
 fun music(name:String){wanted=name}
 fun update(dt:Float){if(released)return;try{if(wanted!=current){fade-=dt/.4f;if(fade<=0){fade=0f;swap(wanted)}}else if(fade<1)fade=minOf(1f,fade+dt/.6f);val v=if(muted)0f else(musicVol*master*fade).coerceIn(0f,1f);mp?.setVolume(v,v)}catch(_:Exception){}}
 private fun swap(name:String?){mp?.let{try{it.stop();it.release()}catch(_:Exception){}};mp=null;current=name;if(name==null)return;try{ctx.assets.openFd("audio/music/$name.wav").use{afd->val m=MediaPlayer();m.setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_GAME).setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build());m.setDataSource(afd.fileDescriptor,afd.startOffset,afd.length);m.isLooping=true;m.setVolume(0f,0f);m.prepare();m.start();mp=m}}catch(_:Exception){mp=null}}
 fun pauseMusic(){try{mp?.pause()}catch(_:Exception){}}
 fun resumeMusic(){try{if(!released)mp?.start()}catch(_:Exception){}}
 fun release(){released=true;try{mp?.release()}catch(_:Exception){};mp=null;try{pool?.release()}catch(_:Exception){}}
}
