require('dotenv').config();

/**
 * @factory config
 * @description base app's configuration
 * @returns {{
 *  mongo: {
 *    uri: string,
 *    collectionPrefix: string
 *    },
 *  rabbit: {
 *    url: string,
 *    serviceName: string
 *    },
 *  node: {
 *    dbpath: string,
 *    network: string,
 *    dbDriver: string,
 *    ipcName: string,
 *    ipcPath: string
 *    }
 *  }}
 */

module.exports = {
  rest: 'http://54.149.244.28:8080',
  stomp: {
    url: 'http://54.218.43.230:15674/stomp',
    creds: {
      login: 'test',
      pass: 'test123'
    },
    serviceName: process.env.RABBIT_SERVICE_NAME || 'app_bitcoin'
  },
  node: {
    rest: 'https://api.blocktrail.com/cb/v0.2.1/tBTC',
    api_key: 'c0bd8155c66e3fb148bb1664adc1e4dacd872548',
    faucetWIF: 'cQqjeq2rxqwnqwMewJhkNtJDixtX8ctA4bYoWHdxY4xRPVvAEjmk'
  }
};
