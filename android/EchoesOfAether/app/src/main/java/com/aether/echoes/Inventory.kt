package com.aether.echoes
import kotlin.math.min
enum class Rarity { COMMON, UNCOMMON, RARE, EPIC, LEGENDARY }
class ItemDef(val id: String, val name: String, val rarity: Rarity, val maxStack: Int, val category: String)
object ItemDb { val items: Map<String, ItemDef> = listOf(ItemDef("potion","Aether Tonic",Rarity.COMMON,20,"Consumables"),ItemDef("aether_shard","Aether Shard",Rarity.COMMON,999,"Materials"),ItemDef("ancient_note","Ancient Note",Rarity.UNCOMMON,1,"Quest Items")).associateBy{it.id} }
class Inventory {
 private val q=LinkedHashMap<String,Int>()
 fun count(id:String)=q[id]?:0
 fun add(id:String,n:Int):Int{val d=ItemDb.items[id]?:return 0;if(n<=0)return 0;val cur=count(id);val a=min(n,d.maxStack-cur);if(a<=0)return 0;q[id]=cur+a;return a}
 fun remove(id:String,n:Int):Boolean{if(n<=0)return false;val cur=count(id);if(cur<n)return false;if(cur==n)q.remove(id)else q[id]=cur-n;return true}
 fun snapshot():Map<String,Int> = HashMap(q)
 fun load(m:Map<String,Int>){q.clear();for((k,v)in m)add(k,v)}
}