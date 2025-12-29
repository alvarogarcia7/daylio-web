const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

class ServerHelper {
  constructor(backupFile = 'e2e/fixtures/test-backup.daylio', port = 5000) {
    this.backupFile = backupFile;
    this.port = port;
    this.serverProcess = null;
  }

  async start() {
    if (this.serverProcess) {
      throw new Error('Server is already running');
    }

    const serverPath = path.join(process.cwd(), 'server.js');
    const backupPath = path.join(process.cwd(), this.backupFile);

    return new Promise((resolve, reject) => {
      this.serverProcess = spawn('node', [serverPath, backupPath], {
        env: { ...process.env, PORT: this.port },
        stdio: 'pipe'
      });

      let startupOutput = '';

      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        startupOutput += output;
        if (output.includes('info: running')) {
          this.waitForServer().then(resolve).catch(reject);
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        console.error(`Server error: ${data}`);
      });

      this.serverProcess.on('error', (error) => {
        reject(new Error(`Failed to start server: ${error.message}`));
      });

      this.serverProcess.on('exit', (code) => {
        if (code !== 0 && code !== null) {
          reject(new Error(`Server exited with code ${code}`));
        }
      });

      setTimeout(() => {
        if (!startupOutput.includes('info: running')) {
          reject(new Error('Server startup timeout'));
        }
      }, 30000);
    });
  }

  async waitForServer(maxAttempts = 30, delayMs = 1000) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        await this.checkServer();
        return;
      } catch (error) {
        if (i === maxAttempts - 1) {
          throw new Error('Server failed to respond in time');
        }
        await this.sleep(delayMs);
      }
    }
  }

  checkServer() {
    return new Promise((resolve, reject) => {
      const req = http.get(`http://localhost:${this.port}/`, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          reject(new Error(`Server returned status ${res.statusCode}`));
        }
        res.resume();
      });

      req.on('error', reject);
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  async stop() {
    if (!this.serverProcess) {
      return;
    }

    return new Promise((resolve) => {
      this.serverProcess.on('exit', () => {
        this.serverProcess = null;
        resolve();
      });

      this.serverProcess.kill('SIGTERM');

      setTimeout(() => {
        if (this.serverProcess) {
          this.serverProcess.kill('SIGKILL');
        }
      }, 5000);
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getBaseUrl() {
    return `http://localhost:${this.port}`;
  }

  isRunning() {
    return this.serverProcess !== null;
  }
}

module.exports = ServerHelper;
