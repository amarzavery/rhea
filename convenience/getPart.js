const url = require('url');
const rhea = require('../lib/container');
const amqp = require('./promises');
const uuid = require('uuid');


const connectionString = process.argv[2];
const eventHubName = process.argv[3];


function messageHandler(result) {
  console.log('result.message: ', result.message);
  //console.dir(result.delivery, {depth: 2});
  let bodyStr = result.message.body.toString();
  console.log('received(' + myIdx + '): ', bodyStr);

  try {
    JSON.parse(bodyStr);
  } catch (e) {
    //console.log(e);
  }
  result.delivery.update(undefined, rhea.message.accepted().described());
}

function errorHandler(rx_err) {
  console.warn('==> RX ERROR: ', rx_err);
}

async function getPartitionIds() {
  return new Promise(async function (resolve, reject) {
    const endpoint = '$management';
    const replyTo = uuid.v4();
    const request = {
      body: Buffer.from(JSON.stringify([])),
      properties: {
        message_id: uuid.v4(),
        reply_to: replyTo
      },
      application_properties: {
        operation: "READ",
        name: eventHubName,
        type: "com.microsoft:eventhub"
      }
    };

    const rxopt = { name: replyTo, target: { address: replyTo }};

    const connection = await amqp.fromConnectionString(connectionString);
    console.log('connected');

    const [senderSession, receiverSession] = await Promise.all([
      amqp.createSession(connection),
      amqp.createSession(connection)
    ]);

    const session = amqp.createSession(connection);

    console.log('got sessions');

    const [sender, receiver] = await Promise.all([
      amqp.createSender(session, endpoint, {}),
      amqp.createReceiver(session, endpoint, rxopt)
    ]);

    receiver.on('message', ({ message, delivery }) => {
      console.log('rx: ', message);
      const code = message.application_properties['status-code'];
      const desc = message.application_properties['status-description'];
      if (code === 200) {
        return resolve(message.body.partition_ids);
      }
      else if (code === 404) {
        return reject(desc);
      }
      delivery.update(undefined, rhea.message.accepted().described());
    });

    const delivery = sender.send(request);
    //console.log('delivery: ', delivery);
    console.log('sent message');
  }.bind(this));
}

getPartitionIds().then((res) => {
  console.log(res);
}).catch(err => {
  console.error(err);
  process.exit(1);
});