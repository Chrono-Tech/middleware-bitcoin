/**
 * @module scheduleService
 * @description ping ipfs by specified time in config
 * @see {@link ../../../config.json}
 */

module.exports = async(amqpInstance, event, data) => {

  let channel = await amqpInstance.createChannel();

  try {
    await channel.assertExchange('events', 'direct', {durable: false});
  } catch (e) {
    channel = await amqpInstance.createChannel();
  }

  try {
    await  channel.publish('events', 'bitcoin_transaction', new Buffer(JSON.stringify(tx)));
  } catch (e) {
  }

  await channel.close();

};