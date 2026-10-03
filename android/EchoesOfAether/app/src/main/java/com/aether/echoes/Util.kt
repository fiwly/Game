package com.aether.echoes
import kotlin.math.max
import kotlin.math.min
fun approach(v: Float, t: Float, d: Float): Float = if (v < t) min(v + d, t) else max(v - d, t)
fun overlap(ax: Float, ay: Float, aw: Float, ah: Float, bx: Float, by: Float, bw: Float, bh: Float) = ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by