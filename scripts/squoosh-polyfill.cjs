// Compatibility shim for running Squoosh (@squoosh/lib) on modern Node.
//
// Node >= 21 exposes a read-only global `navigator`, which makes squoosh crash with
//   "TypeError: Cannot set property navigator of #<Object> which has only a getter"
// Node >= 18 exposes a global `fetch`, which makes squoosh's emscripten loader try to
// `fetch()` local .wasm file paths as URLs instead of reading them from disk.
//
// squoosh encodes on worker threads, so this has to be preloaded into every thread
// (via NODE_OPTIONS) and not just into the main process.
const os = require('node:os');

Object.defineProperty(globalThis, 'navigator', {
  value: { hardwareConcurrency: os.cpus().length },
  writable: true,
  configurable: true,
});

delete globalThis.fetch;
