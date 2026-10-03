plugins { id("com.android.application"); id("org.jetbrains.kotlin.android") }

android {
    namespace = "com.aether.echoes"
    compileSdk = 34
    defaultConfig {
        applicationId = "com.aether.echoes"
        minSdk = 24
        targetSdk = 34
        versionCode = 3
        versionName = "0.3.0"
    }
    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"))
        }
    }
    androidResources { noCompress += "wav" }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
    kotlinOptions { jvmTarget = "17" }
}
dependencies {
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.json:json:20231013")
}
