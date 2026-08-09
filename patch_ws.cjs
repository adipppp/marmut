const fs = require('fs');
const path = './node_modules/@sonata-sdk/ws/dist/server.js';
if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');
  // Match the literal string in the compiled JS
  content = content.replace(
    /('Connection:\s*Upgrade\\r\\n'\s*\+)/,
    "$1\n            'Lavalink-Api-Version: 4\\r\\n' +"
  );
  fs.writeFileSync(path, content);
  console.log('Patched @sonata-sdk/ws/dist/server.js with Lavalink-Api-Version: 4');
} else {
  console.error('File not found: ' + path);
}
