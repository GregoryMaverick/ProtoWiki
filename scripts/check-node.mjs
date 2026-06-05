/**
 * ProtoWiki needs Node >= 20.12 for crypto.hash (used by @vitejs/plugin-vue 6).
 * Fail fast with a clear message when an older Node is on PATH.
 */
import crypto from 'node:crypto'

if (typeof crypto.hash === 'function') {
  // OK — caller continues (dev server, build, etc.)
} else {
const version = process.version
const execPath = process.execPath

console.error(`
ProtoWiki cannot start: this Node build is too old for the current Vite toolchain.

  Node:  ${version}
  Path:  ${execPath}

@vitejs/plugin-vue calls crypto.hash(), which requires Node >= 20.12 (this repo pins 20.20.2 in .nvmrc).

Common cause: an old "node" npm package in your home folder wins on PATH, e.g.
  ~/node_modules/node/bin/node  (often v20.2.0)

Fix:
  1. Put a supported Node first on PATH (Homebrew node@20, or nvm use).
  2. Remove the stray package if you do not need it:
       rm -rf ~/node_modules/node
  3. From this repo:  nvm install && nvm use   (or: export PATH="/usr/local/opt/node@20/bin:$PATH")
  4. Reinstall and run:
       npm install
       npm run dev

Check:  node -p "typeof require('node:crypto').hash"   → should print "function"
`)

process.exit(1)
}
