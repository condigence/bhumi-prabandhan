import { spawnSync, spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// npm scripts run through the OS shell (sh on Linux/macOS, cmd.exe on Windows).
// Bash parameter-expansion syntax like ${PORT:-3000} only works under sh/bash,
// so a plain npm script string can't portably supply a PORT default. Resolving
// the port and invoking `serve` from Node instead sidesteps the shell entirely,
// so this behaves identically on Windows, macOS, Linux, and Railway.
const require = createRequire(import.meta.url);
const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const browserDir = join(projectRoot, 'browser');

// `npm start` only serves the prebuilt browser/ output; it doesn't build.
// If a host runs `npm start` without a preceding `npm run build` (or the
// output is just missing locally), every route 404s with no clear reason
// why. Build on demand so `npm start` works standalone everywhere.
if (!existsSync(join(browserDir, 'index.html'))) {
  console.log('browser/ build output not found — running `ng build` first...');
  const ngBin = require.resolve('@angular/cli/bin/ng.js');
  const build = spawnSync(process.execPath, [ngBin, 'build'], {
    cwd: projectRoot,
    stdio: 'inherit',
  });
  if (build.status !== 0) {
    process.exit(build.status ?? 1);
  }
}

const serveBin = require.resolve('serve/build/main.js');
const port = process.env.PORT || '3000';

const child = spawn(process.execPath, [serveBin, '-s', 'browser', '-l', port], {
  stdio: 'inherit',
  cwd: projectRoot,
});

child.on('exit', (code) => process.exit(code ?? 1));
