const _ = require('lodash'),
  Promise = require('bluebird'),
  bitcoin = Promise.promisifyAll(require('bitcoin'));

let client = new bitcoin.Client({
  host: 'localhost',
  port: 8332,
  user: 'user',
  pass: 123
});
module.exports = async addresses => {

  if (!addresses.length)
    return [];


  return await new Promise(res => {
    let answers = [];

    client.cmd(addresses.map(addr => ({
        method: 'getbalance',
        params: [addr]
      })
    ), function(err, balance) {
      answers.push({balance: balance, account: addresses[answers.length]});
      if (answers.length === addresses.length)
        res(answers);
    });
  });

};