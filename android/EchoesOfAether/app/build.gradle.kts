import java.util.Properties
plugins { id("com.android.application"); id("org.jetbrains.kotlin.android") }
val ksFile = rootProject.file("keystore.properties")
val ks = Properties().apply { if (ksFile.exists()) ksFile.inputStream().use { load(it) } }
android {
 namespace = "com.aether.echoes"; compileSdk = 34
 defaultConfig { applicationId = "com.aether.echoes"; minSdk = 24; targetSdk = 34; versionCode = 3; versionName = "0.3.0-full-systems" }
 signingConfigs { if (ks.containsKey("storeFile")) create("release") { storeFile = rootProject.file(ks.getProperty("storeFile")); storePassword = ks.getProperty("storePassword"); keyAlias = ks.getProperty("keyAlias"); keyPassword = ks.getProperty("keyPassword") } }
 buildTypes { release { isMinifyEnabled = true; isShrinkResources = true; proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt")); signingConfigs.findByName("release")?.let { signingConfig = it } } }
 compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
 kotlinOptions { jvmTarget = "17" }
}
dependencies { testImplementation("junit:junit:4.13.2"); testImplementation("org.json:json:20231013") }