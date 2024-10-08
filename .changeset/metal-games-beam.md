---
'@litehex/node-vault': major
---

Fix: Using the environment's global `fetch` API instead of `undici`.

This change makes this library more compatible with JavaScript runtimes that do not support `Node.js` modules. If you want to use `undici` again,  use the [Custom Fetcher](https://github.com/shahradelahi/node-vault/wiki/Usage#custom-fetcher) feature.
