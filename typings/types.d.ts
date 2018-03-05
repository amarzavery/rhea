/// <reference types="node" />
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
export interface CreateTypeDesc {
    (value?: any, code?: any, descriptor?: any): Typed;
    typecode?: number;
}
export interface BufferOps {
    read: (buffer: Buffer, offset: number) => number;
    write: (buffer: Buffer, value: any, offset: number) => void;
}
export declare enum TypeNames {
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
export declare class Typed {
    type: TypeDesc;
    value: any;
    array_constructor?: ArrayConstructor;
    descriptor?: any;
    constructor(type: TypeDesc, value: any, code?: number, descriptor?: any);
    toString(): string | null;
    toLocaleString(): string | null;
    valueOf(): any;
    toJSON(): any;
}
export declare class TypeDesc {
    name: string;
    typecode: number;
    width: number;
    category?: number;
    read?: BufferOps["read"];
    write?: BufferOps["write"];
    encoding?: string;
    create: CreateTypeDesc;
    constructor(name: string, typecode: number, props?: any, empty_value?: any);
    toString(): string;
}
export declare class types {
    by_code: {
        [x: number]: TypeDesc;
    };
    MAX_UINT: number;
    MAX_USHORT: number;
    Null: any;
    Boolean: any;
    True: any;
    False: any;
    Ubyte: any;
    Ushort: any;
    Uint: any;
    SmallUint: any;
    Uint0: any;
    Ulong?: Typed | CreateTypeDesc;
    SmallUlong: any;
    Ulong0: any;
    Byte: any;
    Short: any;
    Int: any;
    SmallInt: any;
    Long: any;
    SmallLong: any;
    Float: any;
    Double: any;
    Decimal32: any;
    Decimal64: any;
    Decimal128: any;
    CharUTF32: any;
    Timestamp: any;
    Uuid: any;
    Vbin8: any;
    Vbin32: any;
    Str8: any;
    Str32: any;
    Sym8: any;
    Sym32: any;
    List0: any;
    List8: any;
    List32: any;
    Map8: any;
    Map32: any;
    Array8: any;
    Array32: any;
    Reader: any;
    Writer: any;
    wrap_error: any;
    constructor();
    is_ulon(o: Typed): boolean;
    is_string(o: Typed): boolean;
    is_symbol(o: Typed): boolean;
    is_list(o: Typed): boolean;
    is_map(o: Typed): boolean;
    wrap_boolean(v: any): Typed;
    wrap_ulong(l: Buffer | number | Number): any;
    wrap_uint(l: number): Typed;
    wrap_ushort(l: any): Typed;
    wrap_ubyte(l: any): Typed;
    wrap_long(l: Buffer | number): Typed;
    wrap_int(l: number): Typed;
    wrap_short(l: any): Typed;
    wrap_byte(l: any): Typed;
    wrap_float(l: any): Typed;
    wrap_double(l: any): Typed;
    wrap_timestamp(l: any): Typed;
    wrap_char(v: any): Typed;
    wrap_uuid(v: any): Typed;
    wrap_binary(s: any): Typed;
    wrap_string(s: any): Typed;
    wrap_symbol(s: any): Typed;
    wrap_list(l: any): Typed;
    wrap_map(m: object, key_wrapper?: Function): Typed;
    wrap_symbolic_map(m: object): Typed;
    wrap_array(l: any, code: number, descriptors: any): Typed;
    wrap(o: any): Typed;
    wrap_described(value: any, descriptor: string | number | Number): Typed;
    wrap_message_id(o: any): any;
    described_nc(descriptor: any[] | any, o: any): any;
    described: (descriptor: any, o: any) => any;
    unwrap_map_simple(o: any): {};
    unwrap(o: any, leave_described?: boolean): any;
    define_composite(def: ICompositeType): any;
}
