const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const fs = require('fs');

class ServerHelper {
  constructor(backupFile = 'e2e/fixtures/test-backup.daylio', port = 5000) {
    this.backupFile = backupFile;
    this.fixtureFile = backupFile;
    this.port = port;
    this.serverProcess = null;
    this.baseURL = `http://localhost:${this.port}`;
  }

  async start() {
    if (this.serverProcess) {
      throw new Error('Server is already running');
    }

    return new Promise((resolve, reject) => {
      const dbPath = path.join(__dirname, '..', '..', 'data', 'daylio.db');
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
      }

      const serverPath = path.join(process.cwd(), 'server.js');
      const backupPath = path.join(process.cwd(), this.backupFile);

      this.serverProcess = spawn('node', [serverPath, backupPath], {
        env: { ...process.env, PORT: this.port },
        stdio: 'pipe'
      });

      let startupOutput = '';
      const timeout = setTimeout(() => {
        this.stop();
        reject(new Error('Server startup timeout'));
      }, 30000);

      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        startupOutput += output;
        if (output.includes('info: running')) {
          clearTimeout(timeout);
          this.waitForServer().then(resolve).catch(reject);
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        console.error(`Server error: ${data}`);
      });

      this.serverProcess.on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`Failed to start server: ${error.message}`));
      });

      this.serverProcess.on('exit', (code) => {
        if (code !== 0 && code !== null) {
          clearTimeout(timeout);
          reject(new Error(`Server exited with code ${code}`));
        }
      });
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
      const timeout = setTimeout(() => {
        if (this.serverProcess) {
          this.serverProcess.kill('SIGKILL');
        }
        this.serverProcess = null;
        resolve();
      }, 5000);

      this.serverProcess.on('exit', () => {
        clearTimeout(timeout);
        this.serverProcess = null;
        resolve();
      });

      this.serverProcess.kill('SIGTERM');
    });
  }

  async restart(newFixtureFile = null) {
    await this.stop();
    if (newFixtureFile) {
      this.fixtureFile = newFixtureFile;
      this.backupFile = newFixtureFile;
    }
    await this.start();
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getBaseUrl() {
    return `http://localhost:${this.port}`;
  }

  getBaseURL() {
    return this.baseURL;
  }

  isRunning() {
    return this.serverProcess !== null && !this.serverProcess.killed;
  }

  async waitForReady(maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        await new Promise((resolve, reject) => {
          const req = http.get(this.baseURL, (res) => {
            if (res.statusCode === 200) {
              resolve();
            } else {
              reject(new Error(`Status: ${res.statusCode}`));
            }
          });
          req.on('error', reject);
          req.setTimeout(1000);
        });
        return true;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    return false;
  }
}

module.exports = ServerHelper;
