import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

// npm scripts run through the OS shell (sh on Linux/macOS, cmd.exe on Windows).
// Bash parameter-expansion syntax like ${PORT:-3000} only works under sh/bash,
// so a plain npm script string can't portably supply a PORT default. Resolving
// the port and invoking `serve` from Node instead sidesteps the shell entirely,
// so this behaves identically on Windows, macOS, Linux, and Railway.
const require = createRequire(import.meta.url);
const serveBin = require.resolve('serve/build/main.js');
const port = process.env.PORT || '3000';

const child = spawn(process.execPath, [serveBin, '-s', 'browser', '-l', port], {
  stdio: 'inherit',
});

child.on('exit', (code) => process.exit(code ?? 1));
