# rhea

A reactive library for the [AMQP](http://amqp.org/) protocol, for easy
development of both clients and servers.

* [Hello World!](#hello-world)
* [API](#api)

## Hello World!

Brief example of sending and receiving a message through a
broker/server listening on port 5672:

```js
var container = require('rhea');
container.on('connection_open', function (context) {
    context.connection.attach_receiver('examples');
    context.connection.attach_sender('examples');
});
container.on('message', function (context) {
    console.log(context.message.body);
    context.connection.close();
});
container.once('sendable', function (context) {
    context.sender.send({body:'Hello World!'});
});
container.connect({'port':5672});
```

output:
```
Hello World!
```
## Dependencies

* debug (for simple debug logging - may be replaced in the near term)

## Examples

There are some examples of using the library under the examples
folder. These include:

* helloworld.js - essentially the code above, which sends and receives
  a single message through a broker

* direct_helloworld.js - an example showing the sending of a single
  message without the use of a broker, by listening on a port and then
  openning a connection to itself over which the message is
  transfered.

* simple_send.js - connects to a specified port then sends a number of
  messages to a given address

* simple_recv.js - connects to a specified port thensubscribes to
  receive a number of messages from a given address

These last two can be used together to demsontrate sending messages
from one process to another, using a broker or similar intermediary to
which they both connect.

* direct_recv.js - listens on a given port for incoming connections
  over which it will then receive a number of messages

The direct_recv.js example can be used in conjunction with the
simple_send.js example to demonstrate sending messages between
processes without the use of any intermediary. Note however the the
dfeualt port of one or ther other will need to be changed through the
-p command line option.

* client.js and server.js - A request-response example where the
  'client' sends messages to a 'server' (or service) which converts
  them to upper case and sends them back. This demonstrates the use of
  temporary addresses among other things. Using these two together
  requires a broker or similar intermediary.

To run the examples you will need the dependencies installed: the
library itself depends on the 'debug' module, and some of the examples
depend on the 'yargs' module for command line option parsing.

The 'rhea' module itself must also be findable by node. You can do
this either by checking out the code from git and setting NODE_PATH to
include the directory to which you do so (i.e. the directory in which
'a directory named 'rhea' can be found, or you can install the module
using npm.

## API

There are four core types of object in the API:

  * <a href="#container">Containers</a>,
  * <a href="#connection">Connections</a>,
  * <a href="#receiver">Receivers</a>,
  * and <a href="#sender">Senders</a>

Each of these inherits all the methods of EventEmitter, allowing
handlers for particular events to be attached. Events that are not
handled at sender or receiver scope are then propagated up to possibly
be handled at connection scope. Events that are not handled at
connection scope are then propagated up to possibly be handled at
container scope.

---------------------------------------------------------------------
### Container

An AMQP container from which outgoing connections can be made and/or
to which incoming connections can be accepted. The module exports a
default instance of a Container which can be used directly. Other
instances can be created from that if needed using the
create_container method. A container is identified by the
id property. By default a uuid is used, but the property
can be set to something more specific if desired before making or
accepting any connections.

#### methods:

##### connect(options)

Connects to the server specified by the host and port supplied in the
options and returns a <a href="#connection">Connection</a>.

The options argument is an object that may contain any of the
following fields:

  * host
  * port
  * user
  * password
  * id (overrides the container identifier)
  * reconnect - if true, library will automatically reconnect if
    disconnected

##### listen(options)

Starts a server socket listening for incoming connections on the port
(and optionally interface) specified in the options.

The options argument is an object that may contain any of the
following fields:

  * host
  * port

##### create_container()

Returns a new container instance. The method takes an options object
which can contain the following field:

  * id

If no id is specified a new uuid will be generated.

##### generate_uuid()

Simple utility for generating a stringified uuid, useful if you wish
to specify distinct container ids for different connections.

---------------------------------------------------------------------
### Connection

#### methods:

##### attach_receiver(address|options)

Establishes a link over which messages can be received and returns a
<a href="#receiver">Receiver</a> representing that link. A receiving
link is a subscription, i.e. it expresses a desire to receive
messages.

The argument to this method can either be a simple string indicating
the source of messages of interest (e.g. a queue name), or an options
object that may contain any of the following fields:

  * source - The source from which messages are received. This can be
    a simple string address/name or a nested object itself containing
    the fields:
    * address
    * dynamic
    * expiry_policy
    * durable
  * target - The target of a receiving link is the local
    identifier. It is often not needed, but can be set if it is,
  * name - The name of the link. This should be unique for the
    container. If not specified a unqiue name is generated.
  * prefetch - A 'prefetch' window controlling the flow of messages
    over this receiver. Defaults to 500 if not specified. A value of 0
    can be used to turn of automatic flow control and manage it
    directly.
  * autoaccept - Whether received messages should be automatically
    accepted. Defaults to true.

Note: If the link doesn't specify a value for the prefetch and
autoaccept options, the connection options are consulted followed by
the container options. The default is used only if an option is not
specified at any level.

##### attach_sender(address|options)

Establishes a link over which messages can be sent and returns a <a
href="#sender">Sender</a> representing that link. A sending link is an
analogous concept to a subscription for outgoing rather than incoming
messages. I.e. it expresses a desire to send messages.

The argument to this method can either be a simple string indicating
the target for messages of interest (e.g. a queue name), or an options
object that may contain any of the following fields:

  * target - The target to which messages are sent. This can be a
    simple string address/name or a nested object itself containing
    the fields:
    * address
    * dynamic
    * expiry_policy
    * durable
  * source - The source of a sending link is the local identifier. It
    is usually not needed, but can be set if it is,
  * name - The name of the link. This should be unique for the
    container. If not specified a unqiue name is generated.
  * autosettle - Whether sent messages should be automatically
    settled once the peer settles them. Defaults to true.

Note: If the link doesn't specify a value for the autosettle option,
the connection options are consulted followed by the container
options. The default is used only if an option is not specified at any
level.

##### close()

Closes a connection.

#### events:

##### connection_open

Raised when the remote peer indicates the connection is open.

##### connection_close

Raised when the remote peer indicates the connection is closed.

##### disconnected

Raised when the underlying tcp connection is lost.

---------------------------------------------------------------------
### Receiver

#### methods:

##### source_address()

Returns the address of the source from which this receiver is
receiving messages. This can be useful when the source name is
generated by the peer, i.e. for so-called dyanmic nodes (like
temporary queues) used in some request-response patterns.

##### close()

Closes a receiving link (i.e. cancels the subscription).

##### detach()

Detaches a link without closing it. For durable subscriptions this
means the subscription is inactive, but not cancelled.

##### flow(n)

By default, receivers have a prefetch window that is moved
automatically by the library. However if desired the application can
set the prefecth to zero and manage credit itself. Each invocation of
flow() method issues credit for a further 'n' messages to be sent by
the peer over this receiving link.

##### credit()

Returns the amount of outstanding credit that has been issued.

#### events:

##### message

Raised when a message is received.

##### receiver_open

Raised when the remote peer indicates the link is open (i.e. attached
in AMQP parlance).

##### receiver_close

Raised when the remote peer indicates the link is closed.

---------------------------------------------------------------------
### Sender

#### methods:

##### send(msg)

Sends a message. A message is an object that may contain the following fields:

  * header, an object which has the following fields:
    * durable
    * first_acquirer
    * priority
    * ttl
    * delivery_count
  * properties, an object which has the following fields:
    * reply_to
    * to
    * subject
    * content_type
    * content_encoding
    * group_id
    * id
    * correlation_id
  * body, which can be either a string, an object or a buffer

##### close()

Closes a sending link.

##### detach()

Detaches a link without closing it.

##### credit()

Returns the amount of outstanding credit that has been issued by the
peer. This is the number of messages that can be transferred over the
link. If messages are sent for which there is no credit, they are not
transmitted, but are buffered locally until sufficent credit has been
allocated by the peer.

##### queued()

Returns the number of messages that have been sent but not yet
transmitted.

#### events:

##### sendable

Raised when the sender has sufficient credit to be able to transmit
messages to its peer.

##### accepted

Raised when a sent message is accepted by the peer.

##### released

Raised when a sent message is released by the peer.

##### rejected

Raised when a sent message is rejected by the peer.

##### receiver_open

Raised when the remote peer indicates the link is open (i.e. attached
in AMQP parlance).

##### receiver_close

Raised when the remote peer indicates the link is closed.