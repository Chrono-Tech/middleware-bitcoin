const _ = require('lodash'),
  Network = require('bcoin/lib/protocol/network'),
  TX = require('bcoin/lib/primitives/tx'),
  fetchUTXOService = require('../core/rest/utils/fetchUTXOService');

let init = async () => {

  let txHex = '0100000003c6b6a3341c53401a4c4b03641f039c745fe0af38aebd5490d8669a600008ff4d010000006a473044022025a7a0cd55911f613cfbf9c42a2b6ab8d043f9aec96c26447075154f07de4797022062940fb599c2fcbb71e892fac653d011131bcce471c51565d3fc604bfd46ef0e01210357645379e6acb794c30854a1d54ab302bdae7bc941f6f0afdc63fddb8478ad52ffffffffda0e5c4f5810fa048a71712275867a9ecb21511aba67b36ecb58b4f995ac67b6000000006c493046022100b2b82f96193aeaf6bc726b266e414cb8e26bddb48f96171fc31125957a393549022100ffc6da6bc2e203324f01f1c30fcae1475027a8630f7e2c20e46267aac825a80a01210357645379e6acb794c30854a1d54ab302bdae7bc941f6f0afdc63fddb8478ad52ffffffff3705360237fc477a0724d48e82decfe13f028b68605a1d3ddba42ad69c24ab4f010000006c493046022100d1cd7f8695284de1484cd7b1f6afed5706e3eaa5e65cba40b380adad5a194dde022100e13bdbf17184f2ee532d5d555c41dbe3f9702725d87dd66859683bffc9e11b6e0121022914b2e4f4bad049e729f015bfa43d0ea8d55ddb1bb615b1afb735c846c70462ffffffff0250e73dda000000001976a914e63413e5ea824f862f7fc02c0631ff752c5d942588acc89dce0c000000001976a9149e266d284c630e0ee1361ef1fa963b69b147bd7888ac00000000';

  let decodedTx = TX.fromRaw(txHex, 'hex');
  let network = Network.get('testnet');
  let tx = decodedTx.getJSON(network);

  let coinInput = await Promise.all(tx.inputs.map(input => fetchUTXOService(input.address)));

  //input 85 -> output 25 = total is input - output, or if there is no output then input - input
  //input 85 -> output 25 amount: -50, or if no output - amount: -85

  let inAddresses = _.chain(tx.inputs)
    .map(input => {
      let inValue = _.chain(coinInput)
        .find({hash: input.hash})
        .get('value', 0)
        .value();

      let outValue = _.chain(tx.outputs)
        .find({address: input.address})
        .get('value', 0)
        .value();

      return {
        address: input.address,
        amount: outValue - inValue
      };
    })
    .groupBy('address')
    .map((value, key) => ({
        address: key,
        amount: _.chain(value)
          .map(i => i.amount)
          .sum()
          .value()
      })
    )
    .value();

  let outAddresses = _.chain(tx.outputs)
    .reject(output => _.find(inAddresses, {address: output.address}))
    .map(output => ({address: output.address, amount: output.value}))
    .groupBy('address')
    .map((value, key) => ({
        address: key,
        amount: _.chain(value)
          .map(i => i.amount)
          .sum()
          .value()
      })
    )
    .value();

  let balances = _.union(inAddresses, outAddresses);

  console.log(balances);

};

module.exports = init();