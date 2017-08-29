const bcoin = require('bcoin'),
  Coin = require('bcoin/lib/primitives/coin');

const node = new bcoin.fullnode({
  network: 'testnet',
  db: 'leveldb',
  prefix: './db',
  spv: true,
  indexTX: true,
  indexAddress: true
});

(async function () {
  await node.open();
  await node.connect();

  let result = await node.getTXByAddress('mobEo1ujMWMQiQ2fQQ3UzLUxFUh6tLNEVd');

  let tx = result[0];

  let total = 0;
  for (let i = 0; i < tx.outputs.length; i++) {
    let coin = Coin.fromTX(result[0], i, -1);
    if (coin)
      total += coin.value;
  }


  console.log(total);
/*  let coin = Coin.fromTX(result[0], 0, -1)
  console.log(coin);*/

})();
