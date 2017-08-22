const bitcoin = require('bitcoinjs-lib');

const decodeFormat = tx => ({
  txid: tx.getId(),
  version: tx.version,
  locktime: tx.locktime,
});

const decodeInput = tx =>
  tx.ins.map(input => ({
    txid: input.hash.reverse().toString('hex'),
    n: input.index,
    script: bitcoin.script.toASM(input.script),
    sequence: input.sequence,
  })
  );

const decodeOutput = (tx, network) =>
  tx.outs.map((out, n) => {
    let vout = {
      satoshi: out.value,
      value: (1e-8 * out.value).toFixed(8),
      n: n,
      scriptPubKey: {
        asm: bitcoin.script.toASM(out.script),
        hex: out.script.toString('hex'),
        type: bitcoin.script.classifyOutput(out.script),
        addresses: [],
      },
    };

    if (['scripthash', 'pubkeyhash'].includes(vout.scriptPubKey.type))
    {try {
      vout.scriptPubKey.addresses.push(bitcoin.address.fromOutputScript(out.script, network));
    } catch (e) {
      }}

    return vout;
  });

module.exports = function (rawtx, network) {
  this.tx = bitcoin.Transaction.fromHex(rawtx);
  this.network = network;
  this.format = decodeFormat(this.tx);
  this.inputs = decodeInput(this.tx);
  this.outputs = decodeOutput(this.tx, network);
};
