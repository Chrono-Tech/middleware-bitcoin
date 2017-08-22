const bunyan = require('bunyan'),
  log = bunyan.createLogger({name: 'core.blockProcessor.services.eventsEmitterService'});

/**
 * @module scheduleService
 * @description ping ipfs by specified time in config
 * @see {@link ../../../config.json}
 */

module.exports = async(amqpInstance, event, data) => {

  let channel = await amqpInstance.createChannel();

  try {
    await channel.assertExchange('events', 'topic', {durable: false});
  } catch (e) {
    channel = await amqpInstance.createChannel();
  }

  try {
    await  channel.publish('events', event, new Buffer(JSON.stringify(data)));
  } catch (e) {
    log.error(e);
  }

  await channel.close();

};