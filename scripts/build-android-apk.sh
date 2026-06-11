#!/bin/bash
# Syng — APK de prueba para Samsung ($0, sin Play Store)
set -e
cd "$(dirname "$0")/.."

export JAVA_HOME="${JAVA_HOME:-/Applications/Android Studio.app/Contents/jbr/Contents/Home}"
export PATH="$JAVA_HOME/bin:$PATH"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"

if [ ! -f android/local.properties ]; then
  echo "sdk.dir=$ANDROID_HOME" > android/local.properties
fi

if [ ! -f android/app/google-services.json ]; then
  echo ""
  echo "FALTA: android/app/google-services.json"
  echo ""
  echo "1. Firebase Console → syng-app → ⚙ → Agregar app → Android"
  echo "   Package: app.syng.mobile"
  echo "2. Descarga google-services.json → android/app/"
  echo "3. Vuelve a correr: npm run android:apk"
  echo ""
  exit 1
fi

npm run cap:sync
cd android
./gradlew assembleDebug
APK="app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "✓ APK listo: android/$APK"
echo ""
echo "Instalar en Samsung (USB + depuración activada):"
echo "  adb install -r $APK"
echo ""
echo "O copia el APK al teléfono e instálalo manualmente."
echo ""
