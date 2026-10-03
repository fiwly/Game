package com.aether.echoes
import org.junit.Assert.*
import org.junit.Test
import java.io.File
class CoreTests{
 @Test fun inventory(){val i=Inventory();assertEquals(0,i.add("bad",1));assertEquals(20,i.add("potion",99));assertTrue(i.remove("potion",20));assertEquals(0,i.count("potion"))}
 @Test fun saveRecovery(){val d=File.createTempFile("sv","").let{it.delete();it.mkdirs();it};val m=SaveManager(d);m.save(SaveData(gold=50,abilities=setOf("dash"),inventory=mapOf("potion" to 3)));m.save(SaveData(gold=75,abilities=setOf("dash","bad"),inventory=mapOf("potion" to 3,"fake" to 9)));assertEquals(75,m.load()!!.gold);File(d,"save.json").writeText("{bad");assertEquals(50,m.load()!!.gold)}
 @Test fun world(){val w=World();for(c in w.enemySpawnCols)assertTrue(w.solid(c,12)&&!w.solid(c,11))}
}