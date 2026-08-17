# Native release guide

Scroll Games ships the Vite bundle inside Capacitor projects. Production native builds use `VITE_API_BASE_URL=https://scroll-games.vercel.app`; they do not load a remote app shell or register a service worker.

## Toolchain

- Node.js 20 or newer and npm.
- Capacitor 7.6.8. This is the newest maintained line compatible with Xcode 16; Capacitor 8 requires Xcode 26.
- Xcode 16 or newer, CocoaPods, and an Apple silicon or Intel iOS Simulator runtime.
- JDK 21, Android SDK Platform 36, and Android SDK Build Tools. The project uses Android Gradle Plugin 8.9.1 and the Gradle 8.11.1 wrapper.
- A UTF-8 locale for CocoaPods. The npm sync script sets `LANG` and `LC_ALL` to `en_US.UTF-8`.

Install dependencies from the repository root:

```bash
cd client
npm ci
```

## Local build and run

Build with `.env.native` and copy the result into both native projects:

```bash
npm run native:sync
```

Open or run a platform:

```bash
npm run native:open:ios
npm run native:open:android
npm run native:run:ios
npm run native:run:android
```

Direct CI-style checks:

```bash
npm run native:sync

cd android
JAVA_HOME=/path/to/jdk-21 ./gradlew assembleDebug
cd ..

xcodebuild \
  -workspace ios/App/App.xcworkspace \
  -scheme App \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 16' \
  CODE_SIGNING_ALLOWED=NO \
  build
```

The Android APK is written under `android/app/build/outputs/apk/debug/`. App id and bundle id are `com.scrollgames.app`. iOS and Android both permit portrait and landscape; iPhone upside-down remains disabled.

The native config keeps platform HTTPS defaults: no Capacitor `server.url`, `allowNavigation`, `CapacitorHttp`, Android cleartext opt-in, or iOS App Transport Security exception exists. Keep the current CSP `unsafe-eval` permission until all deployed Unity WebGL builds are proven without it; live managed Unity was exercised with this policy on both simulators.

## Icons and splash screens

Native launcher and splash assets use Scroll Games artwork. For a production artwork refresh, provide a 1024×1024 icon and a 2732×2732 splash master in the structure expected by `@capacitor/assets`, then run:

```bash
npx @capacitor/assets@3.0.5 generate --ios --android
```

Review adaptive Android masks, iOS dark appearance, and portrait/landscape splash crops on real devices before submission.

## Android release

1. Increment `versionCode` and `versionName` in `android/app/build.gradle`.
2. Create or select a private Play upload keystore. Keep the keystore, alias, and passwords outside Git; `*.jks`, `*.keystore`, and `key.properties` are ignored.
3. Configure the release signing config locally or through protected CI secrets.
4. Build the Android App Bundle:

   ```bash
   cd android
   JAVA_HOME=/path/to/jdk-21 ./gradlew bundleRelease
   ```

5. Test the signed bundle through a Play internal-testing track, then promote it. The project targets API 36, required for new Google Play submissions from August 31, 2026.

## iOS release

1. In Xcode, select the App target, set the Apple developer Team, and confirm bundle id `com.scrollgames.app`.
2. Increment `MARKETING_VERSION` and `CURRENT_PROJECT_VERSION`.
3. Select **Any iOS Device (arm64)** and choose **Product → Archive**.
4. In Organizer, validate the archive and distribute it to App Store Connect. Test through TestFlight before release.

A CLI archive is also possible after signing is configured:

```bash
xcodebuild \
  -workspace ios/App/App.xcworkspace \
  -scheme App \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath build/ScrollGames.xcarchive \
  archive
```

## External release inputs

The repository does not contain and must not contain:

- Apple Developer/App Store Connect membership, team selection, distribution certificate, or provisioning profile.
- Google Play Console access, upload keystore, key alias, or signing passwords.
- Protected CI credentials for either store.
- Final submitted listing copy, screenshots, live support/privacy URLs, age/content declarations, regional availability, and reviewer notes based on the approved production catalog.

Complete real-device checks for touch, rotation, audio, WebGL memory pressure, suspend/resume, offline/error recovery, and every listed game before store submission.
