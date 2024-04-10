import { privateToAddress } from 'ethereumjs-util';
import fetch from 'node-fetch';
import { randomBytes } from 'crypto';

const bnbRpcUrl = 'https://bsc-mainnet.blastapi.io/11ce2ca4-d2c8-4279-ba26-2a7af1166144';

const randomKey2 = function () {
    // Tạo ra một private key ngẫu nhiên dưới dạng hex
    return '0x' + randomBytes(32).toString('hex');
}
const fetchWithRetry = async (url, options, retries = 3000, delay = 1000) => {
    try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    } catch (error) {
        if (retries > 0) {
            console.log(`Fetch error: ${error.message}, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithRetry(url, options, retries - 1, delay * 2);
        } else {
            throw error;
        }
    }
};

const getBalance = async (address, rpcUrl) => {
    const data = { jsonrpc: '2.0', method: 'eth_getBalance', params: [address, 'latest'], id: 1 };
    const options = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
    const responseData = await fetchWithRetry(rpcUrl, options);
    return parseInt(responseData.result, 16) /  1e18;
};

const createWallet = async (numOfAddress) => {
    const wallets = [];
    for (let index = 0; index < numOfAddress; index++) {
        const privateKey = randomKey2();
        const address = '0x' + privateToAddress(Buffer.from(privateKey.slice(2), 'hex')).toString('hex');
        wallets.push({
            address,
            privateKey,
            urls: {
                bscscan: `https://testnet.bscscan.com//address/${address}`,
            }
        });
    }
    return wallets;
};


process.on('message', async (message) => {
    if (message === 'start') {
      try {
        //số ví tạo ra
        const numOfWallets = 1000;
        const wallets = await createWallet(numOfWallets);

         // // Thay đổi số địa chỉ này thành số địa chỉ 
        for (const wallet of wallets) {
          const balance = await getBalance(wallet.address, bnbRpcUrl );
          console.log(`${wallet.address}: Private Key: ${wallet.privateKey} 🚀.Balance:${balance}`);
          if (balance === 0) {
            process.send(`${wallet.address}: Private Key: ${wallet.privateKey} 🚀.Balance:${balance}`);
          }
        }
      } catch (error) {
        console.error(error);
      }
    }
  });

process.send('ready');