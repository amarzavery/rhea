import { EventEmitter } from "events";
import { ConnectionOptions } from "tls";
import * as net from "net";
import * as tls from "tls";
import * as debug from "debug";
import * as Buffer from "buffer";

declare namespace util {
  export function generate_uuid(): string;
  export function uuid4(): Buffer;
  export function uuid_to_string(buffer: Buffer): string;
  export function clone(o: any): any;
  export function and(f: Function, g: Function): Function;
  export function is_sender(o: any): boolean;
  export function is_receiver(o: any): boolean;
  export function sender_filter(filter: filter): Function;
  export function receiver_filter(filter: filter): Function;
  export function is_defined(field: any): boolean;
}

declare namespace errors {
  export class ProtocolError extends Error {
    message: string;
    name: string;
    constructor(message: string);
  }
  export class TypeError extends ProtocolError {
    message: string;
    name: string;
    constructor(message: string);
  }
  export class ConnectionError extends Error {
    message: string;
    name: string;
    description: string;
    condition: any;
    connection: any;
    constructor(message: string, condition: any, connection: any);
  }
}

declare namespace endpoint {
  export class EndpointState {
    local_open: boolean;
    remote_open: boolean;
    open_requests: number;
    close_requests: number;
    initialised: boolean;
    constructor();
    init(): void;
    open(): boolean;
    close(): boolean;
    disconnected(): void;
    remote_opened(): boolean;
    remote_closed(): boolean;
    is_open(): boolean;
    is_closed(): boolean;
    has_settled(): boolean;
    need_open(): boolean;
    need_close(): boolean;
  }
}

declare interface filter {
  basicFilter: {
    selector: (s: any) => {
      'jms-selector': types.Typed;
    };
  };
  genericFilter: {
    selector: (s: any, key: any) => {
      key: types.Typed;
    };
  };
}

declare namespace Sasl {
  enum sasl_codes {
    'OK' = 0,
    'AUTH' = 1,
    'SYS' = 2,
    'SYS_PERM' = 3,
    'SYS_TEMP' = 4
  }

  class PlainServer {
    callback: Function;
    outcome?: boolean;
    username?: string;
    constructor(callback: Function);
    start(response: Buffer, hostname: string): void;
  }

  class PlainClient {
    username: string;
    password: string;
    constructor(username: string, password: string);
    start(): Buffer;
  }

  class AnonymousServer {
    outcome?: boolean;
    username?: string;
    constructor();
    start(response: Buffer): void;
  }

  class AnonymousClient {
    username?: 'anonymous';
    constructor(name?: string);
    start(): Buffer;
  }

  class ExternalServer {
    outcome?: boolean;
    username?: string;
    constructor();
    start(): void;
  }

  class ExternalClient {
    username?: string;
    constructor();
    start(): string;
    step(): string;
  }

  class SaslServer {
    connection: Connection;
    transport: Transport;
    mechanisms: any;
    mechanism?: any;
    outcome?: boolean;
    username?: string;
    constructor(connection: Connection, mechanisms: any);
    do_step(challenge): void;
    on_sasl_init(frame: Frame): void;
    on_sasl_response(frame: Frame): void;
    has_writes_pending(): any;
    write(socket: any): void;
    read(buffer: Buffer): any;
  }

  class SaslClient {
    connection: Connection;
    transport: Transport;
    next: any;
    mechanisms: any;
    mechanism?: any;
    mechansm_name?: string;
    hostname: string;
    failed: false;
    constructor(connection: Connection, mechanisms: any, hostname: string);
    on_sasl_mechanisms(frame: Frame): void;
    on_sasl_challenge(frame: Frame): void;
    on_sasl_outcome(frame: Frame): void;
    has_writes_pending(): any;
    write(socket: any): any;
    read(buffer: Buffer): any;
  }

  interface mechs {
    EXTERNAL(): ExternalServer;
  }

  class SelectiveServer {
    header_received: false;
    transports: any;
    selected?: any;
    constructor(connection: Connection, mechansims: any);
    has_writes_pending(): boolean;
    write(socket: any): number;
    read(buffer: Buffer): any;
  }

  interface EnableAnonymousServerMechanism {
    (name: string): void;
    ANONYMOUS(): Sasl.AnonymousServer;
  }

  interface EnablePlainServerMechanism {
    (callback: Function): void;
    PLAIN(): Sasl.PlainServer;
  }

  interface EnableAnonymousClientMechanism {
    (name: string): void;
    ANONYMOUS(): Sasl.AnonymousClient;
  }

  interface EnablePlainClientMechanism {
    (username: string, password: string): void;
    PLAIN(): Sasl.PlainClient;
  }

  interface EnableExternalClientMechanism {
    (): void;
    EXTERNAL(): Sasl.ExternalClient;
  }

  interface default_server_mechanisms {
    enable_anonymous: Sasl.EnableAnonymousServerMechanism;
    enable_plain: Sasl.EnablePlainServerMechanism;
  }

  interface default_client_mechanisms {
    enable_anonymous: Sasl.EnableAnonymousClientMechanism;
    enable_plain: Sasl.EnablePlainClientMechanism;
    enable_external: Sasl.EnablePlainClientMechanism;
  }

  export function server_mechanisms(): default_server_mechanisms;
  export function client_mechanisms(): any;
  export function server_add_external(mechs: mechs): any;
  export const Client: SaslClient;
  export const Server: SaslServer;
  export const Selective: SelectiveServer;
}

declare namespace terminus {
  export function unwrap(field: any): null;
  export function source(): any;
  export function target(): any;
}

declare class Connection {

}

declare interface Frame {

}

declare namespace Container {
  export interface ContainerOptions {
    id?: string;
  }
  export interface ConnectionOptions {
    transport?: string;
    host: string;
    hostname: string;
    port: number;
    reconnect_limit?: number;
    username: string;
    password?: string;
  }
  export interface ListenOptions {
    transport?: TransportOptions;
    port: number;
    host: string;
    [x: string]: any;
  }
  export enum TransportOptions {
    tcp = "tcp",
    tls = "tls",
    ssl = "ssl"
  }
}

declare namespace message {

  class DataSection extends Section {
    typecode: 0x75;
    content: Buffer;
    multiple?: undefined;
    constructor(typecode: 0x75, content: any, multiple?: undefined);
  }

  class DataSections extends Section {
    typecode: 0x75;
    content: Buffer[];
    multiple: true;
    constructor(typecode: 0x75, content: any, multiple: true);
  }

  class SequenceSection extends Section {
    typecode: 0x76;
    content: any;
    multiple?: undefined;
    constructor(typecode: 0x76, content: any, multiple?: undefined);
  }

  class SequenceSections extends Section {
    typecode: 0x76;
    content: any;
    multiple: true;
    constructor(typecode: 0x76, content: any, multiple: true);
  }

  class Section {
    typecode: number;
    content: any;
    multiple?: boolean;
    constructor(typecode: number, content: any, multiple?: boolean);
    described(item?: any): types.Typed<T>;
  }

  class Message {
    [x: string]: any;
    toJSON(): object;
    inspect(): string;
    toString(): string;
  }

  type DescriptorValue = {
    descriptor: {
      value: number;
      [x: string]: any;
    }
    [x: string]: any;
  }
  // export function data_section(data: Buffer): DataSection;
  // export function data_sections(data: Buffer[]): DataSections;
  // export function sequence_section(list: any): SequenceSection;
  // export function sequence_sections(lists: any): SequenceSections;
  // export function are_outcomes_equivalent(a?: DescritorValue, b?: DescritorValue): boolean;
  // export function unwrap_outcome(outcome: any): any;
  // export function is_received(o?: any): boolean;
  // export function is_accepted(o?: any): boolean;
  // export function is_rejected(o?: any): boolean;
  // export function is_released(o?: any): boolean;
  // export function is_modified(o?: any): boolean;
  // export function encode(msg: any): Buffer;
  // export function decode(buffer: Buffer): Message;
  // export function header(): any;
  // export function properties(): any;
}

interface message {
  data_section(data: Buffer): message.DataSection;
  data_sections(data: Buffer[]): message.DataSections;
  sequence_section(list: any): message.SequenceSection;
  sequence_sections(lists: any): message.SequenceSections;
  are_outcomes_equivalent(a?: message.DescriptorValue, b?: message.DescriptorValue): boolean;
  unwrap_outcome(outcome: any): any;
  is_received(o?: any): boolean;
  is_accepted(o?: any): boolean;
  is_rejected(o?: any): boolean;
  is_released(o?: any): boolean;
  is_modified(o?: any): boolean;
  encode(msg: any): Buffer;
  decode(buffer: Buffer): message.Message;
  header(): any;
  properties(): any;
}

declare namespace rpc {
  class Client {

  }

  class Server {

  }
}

declare namespace types {
  export function is_ulong(o: Typed): boolean;
  export function is_string(o: Typed): boolean;
  export function is_symbol(o: Typed): boolean;
  export function is_list(o: Typed): boolean;
  export function is_map(o: Typed): boolean;
  export function wrap_boolean(v: any): Typed;
  export function wrap_ulong(l: Buffer | number | Number): any;
  export function wrap_uint(l: number): Typed;
  export function wrap_ushort(l: any): Typed;
  export function wrap_ubyte(l: any): Typed;
  export function wrap_long(l: Buffer | number): Typed;
  export function wrap_int(l: number): Typed;
  export function wrap_short(l: any): Typed;
  export function wrap_byte(l: any): Typed;
  export function wrap_float(l: any): Typed;
  export function wrap_double(l: any): Typed;
  export function wrap_timestamp(l: any): Typed;
  export function wrap_char(v: any): Typed;
  export function wrap_uuid(v: any): Typed;
  export function wrap_binary(s: any): Typed;
  export function wrap_string(s: any): Typed;
  export function wrap_symbol(s: any): Typed;
  export function wrap_list(l: any): Typed;
  export function wrap_map(m: object, key_wrapper?: Function): Typed;
  export function wrap_symbolic_map(m: object): Typed;
  export function wrap_array(l: any, code: number, descriptors: any): Typed;
  export function wrap(o: any): Typed;
  export function wrap_described(value: any, descriptor: string | number | Number): Typed;
  export function wrap_message_id(o: any): any;
  export function described_nc(descriptor: any[] | any, o: any): any;
  export function described(descriptor: any, o: any): any;
  export function unwrap_map_simple(o: any): {};
  export function unwrap(o: any, leave_described?: boolean): any;
  export const MAX_UINT = 4294967296; // 2^32
  export const MIN_INT = -2147483647;
  export enum TypeNames {
    Null = "Null",
    Boolean = "Boolean",
    True = "True",
    False = "False",
    Ubyte = "Ubyte",
    Ushort = "Ushort",
    Uint = "Uint",
    SmallUint = "SmallUint",
    Uint0 = "Uint0",
    Ulong = "Ulong",
    SmallUlong = "SmallUlong",
    Ulong0 = "Ulong0",
    Byte = "Byte",
    Short = "Short",
    Int = "Int",
    SmallInt = "SmallInt",
    Long = "Long",
    SmallLong = "SmallLong",
    Float = "Float",
    Double = "Double",
    Decimal32 = "Decimal32",
    Decimal64 = "Decimal64",
    Decimal128 = "Decimal128",
    CharUTF32 = "CharUTF32",
    Timestamp = "Timestamp",
    Uuid = "Uuid",
    Vbin8 = "Vbin8",
    Vbin32 = "Vbin32",
    Str8 = "Str8",
    Str32 = "Str32",
    Sym8 = "Sym8",
    Sym32 = "Sym32",
    List0 = "List0",
    List8 = "List8",
    List32 = "List32",
    Map8 = "Map8",
    Map32 = "Map32",
    Array8 = "Array8",
    Array32 = "Array32",
  }

  export enum Category {
    CAT_FIXED = 1,
    CAT_VARIABLE = 2,
    CAT_COMPOUND = 3,
    CAT_ARRAY = 4
  }

  export interface ICompositeType {
    name: string;
    code: number;
    fields: Field[];
  }

  export interface Field {
    name: string;
    type: string;
    mandatory?: boolean;
    default_value?: any;
    multiple?: boolean;
  }

  export interface ArrayConstructor {
    typecode: number;
    descriptor?: any;
  }

  export interface CreateTypeDesc<T, N> {
    (value?: any, code?: any, descriptor?: any): Typed<T>;
    typecode?: N | Number;
  }

  export interface BufferOps {
    read: (buffer: Buffer, offset: number) => number;
    write: (buffer: Buffer, value: any, offset: number) => void;
  }

  export class Typed<T> {
    type: T;
    value: any;
    array_constructor?: ArrayConstructor;
    descriptor?: any;
    constructor(type: T, value: any, code?: number, descriptor?: any);
    toString(): string | null;
    toLocaleString(): string | null;
    valueOf(): any;
    toJSON(): any;
  }

  export interface TypeDesc<name, typecode, width, category> {
    name: name;
    typecode: typecode;
    width: width;
    category: category;
    read?: BufferOps["read"];
    write?: BufferOps["write"];
    encoding?: string;
    create: CreateTypeDesc<TypeDesc<name, typecode, width, category>, typecode>;
    constructor(name: string, typecode: number, props?: any, empty_value?: any);
    toString(): string;
  }

  type NullTypeDesc = TypeDesc<TypeNames.Null, 0x40, 0, Category.CAT_FIXED>;
  type Null = CreateTypeDesc<NullTypeDesc, 64>;
}

export type types = {
  Null: types.CreateTypeDesc<types.NullTypeDesc, 64>;
  by_code: {
    64: types.NullTypeDesc
  }
}



declare namespace ws {
  export interface WrappedConnection {
    [x: string]: any;
    end(): void;
    write(data: any): void;
    on(event: 'data' | 'end' | 'error', handler: Function): void;
    get_id_string(): string;
  }
  export function wrap(ws: any): WrappedConnection;

  export interface IConnect {
    connect(port_ignore: any, host_ignore: any, options_ignore: any, callback: Function): WrappedConnection;
  }

  export interface connect {
    (Impl: any): (url: string, protocols: any, options: any) => () => IConnect
  }
}

declare class Container extends EventEmitter {
  id: string;
  sasl_server_mechanisms: Sasl.default_server_mechanisms;

  filter: filter;
  types: types.types;
  message: message;

  constructor(options?: Container.ContainerOptions);

  dispatch(name: string): boolean;

  connect(options: Container.ConnectionOptions): Connection;

  listen(options: Container.ListenOptions): net.Server | tls.Server;

  create_container(options: Container.ContainerOptions): Container;

  get_option(name: string, default_value: any): any;

  generate_uuid(): string;

  rpc_server(address: string, options: any): rpc.Server;

  rpc_client(address: string): rpc.Client;

  websocket_accept(socket: net.Socket, options: any): void;

  websocket_connect: ws.connect;
}

export = Container;