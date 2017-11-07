const config = require('./config'),
  expect = require('chai').expect,
  Promise = require('bluebird'),
  ctx = {
    network: null,
    accounts: [],
    txs: {},
  },
  bitcoin = require('bitcoinjs-lib'),
  SockJS = require('sockjs-client'),
  Stomp = require('webstomp-client'),
  Blockchain = require('cb-http-client'),
  request = require('request-promise');

describe('core/integration', function () {

  before(async () => {
    let ws = new SockJS(config.stomp.url);
    ctx.stompClient = Stomp.over(ws, {heartbeat: false, debug: false});
    ctx.network = bitcoin.networks.testnet;
    ctx.blockchain = new Blockchain(config.node.rest, {api_key: config.node.api_key});
    let keyPair = bitcoin.ECPair.makeRandom({network: ctx.network});
    let keyPair2 = bitcoin.ECPair.makeRandom({network: ctx.network});
    let keyPair3 = bitcoin.ECPair.fromWIF(config.node.faucetWIF, ctx.network);
    ctx.accounts.push(keyPair, keyPair2, keyPair3);

    await new Promise(res =>
      ctx.stompClient.connect(config.stomp.creds.login, config.stomp.creds.pass, res)
    );

  });

  after(() => {
  });

  it('register address', async () => {
    let response = await request({
      method: 'POST',
      uri: `${config.rest}/addr`,
      body: {
        address: ctx.accounts[0].getAddress()
      },
      json: true
    });

    expect(response).to.include({code: 1});
  });

  it('generate some coins for accountA and validate balance changes via webstomp', async () => {

    return await new Promise((res, rej) => {
      let confirmations = 0;
      let txid = null;
      ctx.stompClient.subscribe(`/exchange/events/${config.stomp.serviceName}_balance.${ctx.accounts[0].getAddress()}`, function (message) {
        message = JSON.parse(message.body);

        if (!txid || txid !== message.tx.txid)
          return;

        expect(message).to.have.all.keys('address', 'balances', 'tx');
        expect(message.balances).to.have.all.keys('confirmations0', 'confirmations3', 'confirmations6');

        expect(message.tx).to.include.keys('txid', 'hash', 'time', 'confirmations',
          'block', 'inputs', 'outputs', 'fee', 'valueIn', 'valueOut'
        );

        if (message.tx.confirmations === 1 || message.tx.confirmations === 3 || message.tx.confirmations === 6)
          confirmations++;

        if (confirmations === 3)
          res();

      });

      new Promise((res, rej) =>
        ctx.blockchain.addresses.unspents(ctx.accounts[2].getAddress(), (err, result) => err ? rej(err) : res(result))
      )
        .then(unspents => {
          let tx = new bitcoin.TransactionBuilder(ctx.network);
          tx.addInput(unspents[0].txId, unspents[0].vout);
          tx.addOutput(ctx.accounts[0].getAddress(), unspents[0].value - 2800);
          tx.sign(0, ctx.accounts[2]);
          tx = tx.build();
          ctx.blockchain.transactions.propagate(tx.toHex(), err => {
            if (err) return rej(err);
            txid = tx.getId();
          })
        });

    });
  });

  it('send coins to accountB from accountA', async () => {

    let coins = await request({
      method: 'GET',
      json: true,
      uri: `${config.rest}/addr/${ctx.accounts[0].getAddress()}/utxo`
    });

    let tx = new bitcoin.TransactionBuilder(ctx.network);
    tx.addInput(coins[0].txid, coins[0].vout);
    tx.addOutput(ctx.accounts[1].getAddress(), coins[0].satoshis - 2800);
    tx.sign(0, ctx.accounts[0]);

    return await new Promise(res => {
      let confirmations = 0;
      let txid = null;
      ctx.stompClient.subscribe(`/exchange/events/${config.stomp.serviceName}_balance.${ctx.accounts[0].getAddress()}`, function (message) {
        message = JSON.parse(message.body);

        if (!txid || txid !== message.tx.txid)
          return;

        expect(message).to.have.all.keys('address', 'balances', 'tx');
        expect(message.tx).to.include.keys('txid', 'hash', 'time', 'confirmations',
          'block', 'inputs', 'outputs', 'fee', 'valueIn', 'valueOut'
        );

        if (message.tx.confirmations === 1)
          expect(message.balances).to.include.all.keys('confirmations0');

        if (message.tx.confirmations === 3)
          expect(message.balances).to.include.keys('confirmations0', 'confirmations3');

        if (message.tx.confirmations === 6)
          expect(message.balances).to.include.keys('confirmations0', 'confirmations3', 'confirmations6');

        if (message.tx.confirmations === 1 || message.tx.confirmations === 3 || message.tx.confirmations === 6)
          confirmations++;

        if (confirmations === 3)
          res();
      });

      request({
        method: 'POST',
        uri: `${config.rest}/tx/send`,
        body: {
          tx: tx.build().toHex()
        },
        json: true
      })
        .then(resp => {
          txid = resp.txid;
        });
    });
  });

  it('remove address', async () => {
    let response = await request({
      method: 'DELETE',
      uri: `${config.rest}/addr`,
      body: {
        address: ctx.accounts[0].getAddress()
      },
      json: true
    });

    expect(response).to.include({code: 1});
  });

});
