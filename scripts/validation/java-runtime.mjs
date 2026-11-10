import { join } from 'node:path';

// setup-java supplies JAVA_HOME on CI. Explicit content overrides take precedence;
// otherwise allow the caller's PATH to select the installed JDK.
export function javaTool(name, environment = process.env, release = 21) {
  const home = (release > 21 ? environment.CONTENT_JAVA26_HOME : undefined) || environment.CONTENT_JAVA_HOME || environment.JAVA_HOME;
  return home ? join(home, 'bin', process.platform === 'win32' ? `${name}.exe` : name) : name;
}
