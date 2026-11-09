# WiFi Radar (Android / Kotlin)

## วิธี A: ให้ GitHub สร้าง APK (ไม่ต้องลง Android Studio)
1. สร้าง repository ใหม่บน github.com
2. อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้ (รวมโฟลเดอร์ .github) ขึ้นไปที่ branch main
3. เปิดแท็บ Actions รอ workflow "Build APK" เสร็จ (ประมาณ 3-5 นาที)
4. กดเข้ารันล่าสุด เลื่อนลงที่ Artifacts แล้วโหลด WifiRadar-APK (เป็น zip ข้างในคือ app-debug.apk)
5. ติดตั้ง app-debug.apk บนอุปกรณ์ Android

## วิธี B: Android Studio
เปิดโฟลเดอร์นี้ -> รอ Gradle Sync -> Build > Build APK(s)
