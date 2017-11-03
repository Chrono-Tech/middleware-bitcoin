require('dotenv/config');

const config = require('./core/middleware-bitcoin-blockprocessor/config'),
  expect = require('chai').expect,
  _ = require('lodash'),
  Promise = require('bluebird'),
  ctx = {
    network: null,
    accounts: [],
    txs: {},
    rest: 'http://localhost:8082',
    stomp: {
      url: 'http://localhost:15674/stomp',
      creds: {
        login: '',
        pass: ''
      }
    }
  },
  Network = require('bcoin/lib/protocol/network'),
  bcoin = require('bcoin'),
  SockJS = require('sockjs-client'),
  Stomp = require('webstomp-client'),
  bcypher = require('blockcypher'),
  bcapi = new bcypher('btc', 'test3', '1aed319fd4a2400b80e2b22090283add'),
  request = require('request-promise');

describe('core/integration', function () {

  before(async () => {
    let ws = new SockJS(ctx.stomp.url);
    ctx.stompClient = Stomp.over(ws, {heartbeat: false, debug: false});
    ctx.network = Network.get('testnet');
    let keyPair = bcoin.hd.generate(ctx.network);
    let keyPair2 = bcoin.hd.generate(ctx.network);
    ctx.accounts.push(keyPair, keyPair2);

    await new Promise(res =>
      ctx.stompClient.connect(ctx.stomp.creds.login, ctx.stomp.creds.pass, res)
    );

  });

  after(() => {
  });

  it('register address', async () => {
    let keyring = new bcoin.keyring(ctx.accounts[0].privateKey, ctx.network);
    let response = await request({
      method: 'POST',
      uri: `${ctx.rest}/addr`,
      body: {
        address: keyring.getAddress().toString()
      },
      json: true
    });

    expect(response).to.include({code: 1});
  });

  it('generate some coins for accountA and validate balance changes via webstomp', async () => {
    let address = new bcoin.keyring(ctx.accounts[0].privateKey, ctx.network).getAddress().toString();
    return await new Promise(res => {
      let confirmations = 0;
      let tx = null;
      ctx.stompClient.subscribe(`/exchange/events/${config.rabbit.serviceName}_balance.${address}`, function (message) {
        message = JSON.parse(message.body);

        if (!tx || tx !== message.tx.txid)
          return;

        console.log(message);

        if (message.tx.confirmations === 1 || message.tx.confirmations === 3 || message.tx.confirmations === 6)
          confirmations++;

        if (confirmations === 3)
          res();

      });

      bcapi.faucet(address, 500000, (err, result) => {
        console.log(result);
        tx = result.tx_ref;
      });

    });
  });

  it('send coins to accountB from accountA', async () => {

    let keyring = new bcoin.keyring(ctx.accounts[0].privateKey, ctx.network);
    let keyring2 = new bcoin.keyring(ctx.accounts[1].privateKey, ctx.network);

    let coins = await request({
      method: 'GET',
      uri: `${ctx.rest}/addr/${keyring.getAddress().toString()}/utxo`
    });

    let inputCoins = _.chain(coins)
      .transform((result, coin) => {
        coin = {
          version: 1,
          height: coin.height,
          value: coin.satoshis,
          coinbase: false,
          hash: coin.txid,
          index: coin.vout
        };

        result.coins.push(bcoin.coin.fromJSON(coin));
        result.amount += coin.value;
      }, {amount: 0, coins: []})
      .value();

    const mtx = new bcoin.mtx();

    mtx.addOutput({
      address: keyring2.getAddress(),
      value: inputCoins.amount - 1000
    });

    await mtx.fund(inputCoins.coins, {
      rate: 10000,
      changeAddress: keyring.getAddress()
    });

    mtx.sign(keyring);
    ctx.tx = mtx.toTX();

    await request({
      method: 'POST',
      uri: `${ctx.rest}/tx/send`,
      body: {
        tx: ctx.tx.toRaw().toString('hex')
      },
      json: true
    });

  });

});
