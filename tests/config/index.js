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


/*    rest: 'http://localhost:8082',
 stomp: {
 url: 'http://localhost:15674/stomp',
 creds: {
 login: '',
 pass: ''
 }
 }*/


module.exports = {
  rest: process.env.REST || 'http://localhost:8081',
  stomp: {
    url: process.env.STOMP_URL || 'http://localhost:15674/stomp',
    creds: {
      login: process.env.STOMP_LOGIN || 'admin',
      pass: process.env.STOMP_PASS || '38309100024'
    },
    serviceName: process.env.RABBIT_SERVICE_NAME || 'app_bitcoin'
  },
  node: {
    rest: 'https://api.blocktrail.com/cb/v0.2.1/tBTC',
    api_key: 'c0bd8155c66e3fb148bb1664adc1e4dacd872548',
    faucetWIF: 'cQqjeq2rxqwnqwMewJhkNtJDixtX8ctA4bYoWHdxY4xRPVvAEjmk'
  }
};
