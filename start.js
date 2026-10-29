const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');

const windows = process.platform === 'win32';
const python = process.env.PYTHON || (windows ? 'python' : 'python3');
const tempMaven = path.join(os.tmpdir(), 'drivewise-exp7-maven', 'apache-maven-3.9.16', 'bin', 'mvn.cmd');
const tempRepository = path.join(os.tmpdir(), 'drivewise-exp7-maven', 'repository');
const usingTempMaven = windows && fs.existsSync(tempMaven);
const maven = usingTempMaven ? tempMaven : windows ? 'mvn.cmd' : 'mvn';
const mavenCheck = spawnSync(maven, ['-version'], { shell: windows, stdio: 'ignore' });

if (mavenCheck.error || mavenCheck.status !== 0) {
  console.error('Maven was not found. Install Maven, reopen this terminal, then run npm start again.');
  process.exit(1);
}

const pythonCheck = spawnSync(python, ['--version'], { shell: windows, stdio: 'ignore' });
if (pythonCheck.error || pythonCheck.status !== 0) {
  console.error('Python was not found. Install Python 3, reopen this terminal, then run npm start again.');
  process.exit(1);
}

function portIsAvailable(port) {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.once('error', () => resolve(false));
    probe.listen(port, '127.0.0.1', () => probe.close(() => resolve(true)));
  });
}

async function startServices() {
  for (const port of [3000, 5000, 8080]) {
    if (!await portIsAvailable(port)) {
      console.error(`Port ${port} is already in use. Stop the service using it, then run npm start again.`);
      process.exit(1);
    }
  }

  const services = [
    spawn(process.execPath, ['server.js'], { stdio: 'inherit' }),
    spawn(python, ['auth-api/app.py'], { stdio: 'inherit' }),
    spawn(maven, [
      ...(usingTempMaven ? [`-Dmaven.repo.local=${tempRepository}`] : []),
      '-f', 'spring-api/pom.xml', 'spring-boot:run',
    ], { stdio: 'inherit', shell: windows }),
  ];
  let stopping = false;

  function stop(exitCode = 0) {
    if (stopping) return;
    stopping = true;

    for (const service of services) {
      if (!service.pid || service.exitCode !== null) continue;
      if (windows) spawnSync('taskkill', ['/pid', String(service.pid), '/t', '/f'], { stdio: 'ignore' });
      else service.kill('SIGTERM');
    }

    process.exit(exitCode);
  }

  for (const service of services) {
    service.on('error', (error) => {
      console.error(`Could not start a DriveWise service: ${error.message}`);
      stop(1);
    });
    service.on('exit', (code) => {
      if (!stopping) {
        console.error(`A DriveWise service stopped${code === 0 ? '' : ` with exit code ${code}`}.`);
        stop(code || 1);
      }
    });
  }

  process.once('SIGINT', () => stop());
  process.once('SIGTERM', () => stop());
}

startServices().catch((error) => {
  console.error(`Could not check DriveWise ports: ${error.message}`);
  process.exit(1);
});
