import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const packageSource = readFileSync(new URL("../package.json", import.meta.url), "utf8");
const readOptional = (path) => {
  const fileUrl = new URL(path, import.meta.url);
  return existsSync(fileUrl) ? readFileSync(fileUrl, "utf8") : "";
};
const mainActivitySource = readOptional("../android/app/src/main/java/com/sagarkrishna/interviewiq/MainActivity.java");

test("configures Capacitor as a hosted InterviewIQ Android shell", () => {
  const configSource = readOptional("../capacitor.config.json");
  assert.notEqual(configSource, "", "capacitor.config.json should exist");

  const config = JSON.parse(configSource);
  assert.equal(config.appId, "com.sagarkrishna.interviewiq");
  assert.equal(config.appName, "InterviewIQ");
  assert.equal(config.webDir, "public");
  assert.equal(config.server.url, "https://elevateprep.vercel.app");
  assert.equal(config.server.cleartext, false);
});

test("declares Capacitor Android dependencies and scripts", () => {
  const pkg = JSON.parse(packageSource);
  assert.equal(pkg.dependencies["@capacitor/core"], "^5.2.3");
  assert.equal(pkg.devDependencies["@capacitor/cli"], "^5.2.3");
  assert.equal(pkg.dependencies["@capacitor/android"], "^5.2.3");
  assert.equal(pkg.scripts["android:sync"], "cap sync android");
  assert.equal(pkg.scripts["android:open"], "cap open android");
  assert.equal(pkg.scripts["android:build"], "cd android && gradlew.bat assembleDebug");
});

test("android manifest includes WebView workflow permissions", () => {
  const manifestSource = readOptional("../android/app/src/main/AndroidManifest.xml");
  assert.notEqual(manifestSource, "", "AndroidManifest.xml should exist");

  assert.match(manifestSource, /android\.permission\.INTERNET/);
  assert.match(manifestSource, /android\.permission\.RECORD_AUDIO/);
  assert.match(manifestSource, /android\.permission\.CAMERA/);
  assert.match(manifestSource, /android\.permission\.ACCESS_NETWORK_STATE/);
});

test("native WebView shell uses Capacitor bridge and file provider support", () => {
  assert.notEqual(mainActivitySource, "", "MainActivity.java should exist");

  const manifestSource = readOptional("../android/app/src/main/AndroidManifest.xml");
  const nativeConfigSource = readOptional("../android/app/src/main/assets/capacitor.config.json");

  assert.match(mainActivitySource, /extends BridgeActivity/);
  assert.match(manifestSource, /androidx\.core\.content\.FileProvider/);
  assert.match(manifestSource, /\$\{applicationId\}\.fileprovider/);
  assert.match(nativeConfigSource, /https:\/\/elevateprep\.vercel\.app/);
});

test("README documents the hosted Android build path", () => {
  const readmeSource = readOptional("../README.md");

  assert.match(readmeSource, /Android App/);
  assert.match(readmeSource, /hosted WebView/);
  assert.match(readmeSource, /https:\/\/elevateprep\.vercel\.app/);
  assert.match(readmeSource, /npm run android:sync/);
  assert.match(readmeSource, /npm run android:open/);
  assert.match(readmeSource, /npm run android:build/);
  assert.match(readmeSource, /Java 17/);
});
