/**
 * Global setup for E2E tests
 * Builds the UI and starts a simple HTTP server before running tests
 */

import { execSync, spawn } from 'child_process';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Store server process for teardown
let serverProcess: ReturnType<typeof spawn> | null = null;

async function globalSetup() {
  const uiDistPath = join(__dirname, '../ui/dist');
  const e2ePath = __dirname;
  
  // Check if UI is already built
  if (!existsSync(uiDistPath)) {
    console.log('Building UI for E2E tests...');
    try {
      execSync('npm run build', {
        cwd: join(__dirname, '../ui'),
        stdio: 'inherit',
      });
      console.log('UI built successfully!');
    } catch (error) {
      console.error('Failed to build UI:', error);
      throw error;
    }
  } else {
    console.log('Using existing UI build...');
  }
  
  // Create a simple HTTP server script
  const serverScript = `
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3456;
const DIST_DIR = path.join(__dirname, '../ui/dist');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Parse URL
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    // Try with .html extension
    filePath += '.html';
  }
  
  if (!fs.existsSync(filePath)) {
    // Fall back to index.html for client-side routing
    filePath = path.join(DIST_DIR, 'index.html');
  }
  
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content, 'utf-8');
  });
});

server.listen(PORT, () => {
  console.log(\`E2E test server running at http://localhost:\${PORT}\`);
});

// Keep the process alive
process.stdin.resume();
`;
  
  // Write server script
  const serverScriptPath = join(e2ePath, '.test-server.js');
  writeFileSync(serverScriptPath, serverScript);
  
  // Start the server
  console.log('Starting E2E test server on port 3456...');
  serverProcess = spawn('node', [serverScriptPath], {
    detached: true,
    stdio: 'ignore',
  });
  
  // Wait a moment for the server to start
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('E2E test server started!');
  
  // Store server PID for teardown
  if (serverProcess.pid) {
    const pidFile = join(e2ePath, '.server.pid');
    writeFileSync(pidFile, serverProcess.pid.toString());
  }
}

export default globalSetup;
