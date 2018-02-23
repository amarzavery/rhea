import { EventEmitter } from "events";
import * as tls from "tls";
import * as net from "net";

namespace ws {

  interface WrappedWebSocket {
    end(): any;
    write(data: any): void;
    on(event: "data" | "end" | "error", handler: Function): void;
    get_id_string(): string;
  }

  interface SocketImpl {
    connect(port_ignore: any, host_ignore: any, options_ignore: any, callback): WrappedWebSocket;
  }

  function nulltransform(data: any): any;

  function from_arraybuffer(data: any): Buffer;

  function to_typedarray(data: any): Uint8Array;

  export function wrap(ws: any): WrappedWebSocket;

  export function connect(Impl: any): (url: string, protocols: any[], options: any) => () => SocketImpl;
}

interface Filter {
  selector(s: any): any;
}

class types {

}

class message {

}

class Connection {

}

class Container extends EventEmitter {

  id: string;

  constructor(options: { id?: string;[x: string]: any; });

  dispatch(name: string): boolean;

  connect(options: any): Connection;

  listen(options: { host?: string, port?: number; transport?: "tcp" | "tls" | "ssl" }): net.Server | tls.Server;

  create_container(options: any): Container;

  get_option(name: string, default_value?: any): any;

  generate_uuid(): string;

  rpc_server(address: string, options: any): any;

  rpc_client(address: string): any;

  websocket_accept(socket: any, options: any): Connection;

  websocket_connect = ws.connect;

  filter: Filter;

  types: types;

  messages: message;

}

export = new Container();