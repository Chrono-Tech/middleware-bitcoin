node.on('block', async function (block) {

  try {
    let addresses = _.chain(block.txs)
      .map(tx => _.union(tx.inputs, tx.outputs))
      .flattenDeep()
      .map(i => (i.getAddress() || '').toString())
      .compact()
      .uniq()
      .chunk(100)
      .value();

    console.log(addresses.length);

    /*      let filteredByChunks = await Promise.all(addresses.map(chunk =>
     accountModel.find({address: {$in: chunk}})
     ));*/

    let filteredByChunks = _.take(addresses, 10);

    let filtered = _.chain(filteredByChunks)
      .flattenDeep()
      .map(address =>
        _.chain(block.txs)
          .filter(tx =>
            _.chain(tx.inputs)
              .union(tx.outputs)
              .flattenDeep()
              .map(i => (i.getAddress() || '').toString())
              .includes(address)
              .value()
          )
          .map(tx =>
            Object.assign(tx.toJSON(), {payload: `${block.rhash().toString()}:${tx.hash}`})
          )
          .value()
      )
      .flattenDeep()
      .uniqBy('payload')
      .value();

    await Promise.all(filtered.map(tx => {
        return new transactionModel(tx).save();
      })
    );

  } catch (e) {
    console.log(e);
  }
});