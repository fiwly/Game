package com.aether.echoes
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.util.zip.CRC32
class SaveData(var version:Int=SaveManager.CURRENT,var cp:Int=0,var hp:Int=100,var aether:Int=100,var gold:Int=0,var level:Int=1,var xp:Int=0,var abilities:Set<String> = emptySet(),var inventory:Map<String,Int> = emptyMap(),var flags:Set<String> = emptySet(),var ctrlScale:Float=1f,var ctrlOpacity:Float=.55f,var shake:Boolean=true)
class SaveManager(dir:File){
 companion object{const val CURRENT=2}
 private val main=File(dir,"save.json");private val bak=File(dir,"save.bak");private val tmp=File(dir,"save.tmp");private val known=setOf("double_jump","wall_jump","dash")
 @Synchronized fun save(d:SaveData):Boolean{try{d.version=CURRENT;val payload=encode(d);val w=JSONObject().put("v",CURRENT).put("crc",crc(payload)).put("data",payload).toString();FileOutputStream(tmp).use{it.write(w.toByteArray());it.fd.sync()};if(main.exists()&&read(main)!=null)main.copyTo(bak,true);if(!tmp.renameTo(main)){main.delete();if(!tmp.renameTo(main))return false};return true}catch(_:Exception){return false}}
 fun load():SaveData?=read(main)?:read(bak)
 private fun crc(s:String):Long=CRC32().also{it.update(s.toByteArray())}.value
 private fun read(f:File):SaveData?{try{if(!f.exists())return null;val w=JSONObject(f.readText());val q=w.getString("data");if(w.getLong("crc")!=crc(q))return null;return sanitize(decode(JSONObject(q),w.getInt("v")))}catch(_:Exception){return null}}
 private fun encode(d:SaveData)=JSONObject().apply{put("cp",d.cp);put("hp",d.hp);put("aether",d.aether);put("gold",d.gold);put("level",d.level);put("xp",d.xp);put("abilities",JSONArray(d.abilities.toList()));put("flags",JSONArray(d.flags.toList()));put("inventory",JSONObject().also{o->d.inventory.forEach{(k,v)->o.put(k,v)}});put("shake",d.shake);put("ctrlScale",d.ctrlScale.toDouble());put("ctrlOpacity",d.ctrlOpacity.toDouble())}.toString()
 private fun decode(o:JSONObject,v:Int):SaveData{require(v in 1..CURRENT);if(v<2&&!o.has("shake"))o.put("shake",true);val inv=HashMap<String,Int>();o.optJSONObject("inventory")?.let{i->i.keys().forEach{k->inv[k]=i.optInt(k)}};fun set(a:JSONArray?):Set<String>{if(a==null)return emptySet();return (0 until a.length()).map{a.getString(it)}.toSet()};return SaveData(CURRENT,o.optInt("cp"),o.optInt("hp",100),o.optInt("aether",100),o.optInt("gold"),o.optInt("level",1),o.optInt("xp"),set(o.optJSONArray("abilities")),inv,set(o.optJSONArray("flags")),o.optDouble("ctrlScale",1.0).toFloat(),o.optDouble("ctrlOpacity",.55).toFloat(),o.optBoolean("shake",true))}
 private fun sanitize(d:SaveData):SaveData{d.cp=d.cp.coerceIn(0,99);d.hp=d.hp.coerceIn(1,9999);d.aether=d.aether.coerceIn(0,9999);d.gold=d.gold.coerceIn(0,999999);d.level=d.level.coerceIn(1,99);d.xp=d.xp.coerceIn(0,999999);d.abilities=d.abilities.filter{it in known}.toSet();d.inventory=d.inventory.filter{(k,v)->ItemDb.items.containsKey(k)&&v>0}.mapValues{(k,v)->v.coerceAtMost(ItemDb.items[k]!!.maxStack)};return d}
}