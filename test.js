import { fork } from 'child_process';
import fs from 'fs';

const createChildProcess = () => {
  return fork('./createWalletAndCheckBalance.js');
};

// Hàm mới để lưu dữ liệu vào file
const saveData = (walletsWithBalance) => {
  const timestamp = new Date().toISOString().replace(/[:.-]/g, '');
  const path = `./walletsWithBalance_${timestamp}.txt`;
  const content = walletsWithBalance.map(wallet => 
    `Address: ${wallet.address}: Private Key: ${wallet.privateKey} 🚀.Balance:${wallet.balance}`
  ).join('\n');
  fs.writeFileSync(path, content, 'utf-8');
  console.log(`Wallets with balance saved to ${path}`);
};

const main = () => {
  return new Promise((resolve, reject) => {
    const processes = [];
    const walletsWithBalance = [];

    //số luồng chạy

    for (let i = 0; i < 500; i++) {
      const childProcess = createChildProcess();

      childProcess.on('message', (message) => {
        //số dư ví = 0 
        if (typeof message === 'object' && message.balance === 0) {
          walletsWithBalance.push(message);
          console.log(`${message.address}: Private Key: ${message.privateKey} 🚀. Balance: ${message.balance}`);
        } else if (message === 'ready') {
          childProcess.send('start');
        }
      });

      childProcess.on('error', (error) => {
        console.log(`Process ${i} error: ${error}`);
        reject(error);
      });

      childProcess.on('exit', (exitCode) => {
        console.log(`Process ${i} exit code: ${exitCode}`);
        if (exitCode !== 0) {
          reject(new Error(`Process ${i} exited with code: ${exitCode}`));
        }
      });
      processes.push(childProcess);
    }

    Promise.all(processes.map(p => new Promise((resolve) => p.on('close', () => resolve()))))
      .then(() => {
        saveData(walletsWithBalance); // Gọi hàm saveData khi tất cả tiến trình con đã hoàn tất
        resolve();
      }).catch(reject);
  });
};

main().catch(console.error);
