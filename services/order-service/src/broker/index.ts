import amqp, { Channel, ChannelModel } from 'amqplib';
import { createPublisher } from './publisher';

export type BrokerRuntime = {
  connection: ChannelModel;
  channel: Channel;
};

export async function createBrokerConnection(input: {
  rabbitmqUrl: string;
  exchange: string;
}): Promise<{ runtime: BrokerRuntime; publish: ReturnType<typeof createPublisher>['publish'] }> {
  const connection = await amqp.connect(input.rabbitmqUrl);
  const channel = await connection.createChannel();

  await channel.assertExchange(input.exchange, 'topic', { durable: true });

  const publisher = createPublisher(channel, input.exchange);

  return {
    runtime: { connection, channel },
    publish: publisher.publish,
  };
}
