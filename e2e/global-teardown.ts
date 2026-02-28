/**
 * Global teardown for E2E tests
 * Stops the HTTP server after all tests complete
 */

import { readFileSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';

async function globalTeardown() {
  const pidFile = join(__dirname, '.server.pid');
  const serverScriptPath = join(__dirname, '.test-server.js');
  
  // Kill the server process
  if (existsSync(pidFile)) {
    const pid = parseInt(readFileSync(pidFile, 'utf-8').trim(), 10);
    
    try {
      process.kill(pid);
      console.log('E2E test server stopped');
    } catch (error) {
      // Process might already be dead
      console.log('Server process already stopped or not found');
    }
    
    // Clean up PID file
    unlinkSync(pidFile);
  }
  
  // Clean up server script
  if (existsSync(serverScriptPath)) {
    unlinkSync(serverScriptPath);
  }
}

export default globalTeardown;
