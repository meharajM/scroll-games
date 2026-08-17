# Mobile simulator testing

Scroll Games is currently a web/PWA project. These checks exercise the installed mobile browsers, not native App Store or Play Store packages.

## Start the app

Run the API and client in separate terminals:

```bash
cd api && npm start
```

```bash
cd client && npm run dev -- --host 0.0.0.0 --port 5173
```

Managed Unity games require valid `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` values in `api/.env`. A hosted-page catalog can be tested without AWS credentials.

## iOS Simulator

Boot a simulator in Xcode, then open the app in Safari:

```bash
xcrun simctl openurl booted http://127.0.0.1:5173
```

## Android emulator

Start an Android Virtual Device and wait until it finishes booting:

```bash
emulator @YOUR_AVD_NAME -gpu host -no-snapshot-save
adb shell getprop sys.boot_completed
adb shell am start -W -a android.intent.action.VIEW -d http://10.0.2.2:5173
```

Use a current Android system image and Chrome/WebView release for the release gate. Old emulator graphics stacks can fail Unity shader compilation even when catalog and asset delivery work.

## Acceptance checklist

- Trial fills the visible browser viewport in portrait and landscape.
- Previous and Next controls are fully visible, at least 44 by 44 CSS pixels, and respond to touch.
- Hosted trial accepts input inside its sandboxed iframe.
- Navigating between Unity games unloads the previous instance before starting the next.
- Loading, network, unsupported WebGL, and graphics-context failures show an error instead of hanging.
- No login is required to browse the catalog.

Native store testing remains separate work: add native iOS and Android wrappers, signing, icons, splash screens, permissions, and store metadata before calling this App Store or Play Store coverage.
