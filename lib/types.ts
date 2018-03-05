/*
 * Copyright 2015 Red Hat Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

import * as errors from "./errors";

const CAT_FIXED = 1;
const CAT_VARIABLE = 2;
const CAT_COMPOUND = 3;
const CAT_ARRAY = 4;
const MAX_UINT = 4294967296; // 2^32
const MIN_INT = -2147483647;

interface ArrayConstructor {
  typecode: number;
  descriptor?: any
}

interface CreateTypeDesc {
  (value?: any, code?: any, descriptor?: any): Typed;
  typecode?: number;
}

interface BufferOps {
  read: (buffer: Buffer, offset: number) => number;
  write: (buffer: Buffer, value: any, offset: number) => void;
}

class Typed {
  type: TypeDesc;
  value: any;
  array_constructor?: ArrayConstructor;
  // TODO: Not sure if this should be here, however after looking at Writer.write() 
  // function definition it seems descriptor is a property of Typed.
  descriptor?: any;

  constructor(type: TypeDesc, value: any, code?: number, descriptor?: any) {
    this.type = type;
    this.value = value;
    if (code) {
      this.array_constructor = { "typecode": code };
      if (descriptor) {
        this.array_constructor.descriptor = descriptor;
      }
    }
  }

  toString(): string | null {
    return this.value ? this.value.toString() : null;
  }

  toLocaleString(): string | null {
    return this.value ? this.value.toLocaleString() : null;
  }

  valueOf(): any {
    return this.value;
  }

  toJSON(): any {
    return this.value && this.value.toJSON ? this.value.toJSON() : this.value;
  }
}

/**
 * Converts a given value to the hexadecimal format.
 * @param {*} i - The value to be converted to hexadecimal format.
 * @returns {striing} - The converted hex string.
 */
function hex(i: any): string {
  return Number(i).toString(16);
}

class TypeDesc {
  name: string;
  typecode: number;
  width: number = 0;
  category?: number;
  read?: BufferOps["read"];
  write?: BufferOps["write"];
  encoding?: string;
  create: CreateTypeDesc

  constructor(name: string, typecode: number, props?: any, empty_value?: any) {
    this.name = name;
    this.typecode = typecode;
    let subcategory = typecode >>> 4;
    switch (subcategory) {
      case 0x4:
        this.width = 0;
        this.category = CAT_FIXED;
        break;
      case 0x5:
        this.width = 1;
        this.category = CAT_FIXED;
        break;
      case 0x6:
        this.width = 2;
        this.category = CAT_FIXED;
        break;
      case 0x7:
        this.width = 4;
        this.category = CAT_FIXED;
        break;
      case 0x8:
        this.width = 8;
        this.category = CAT_FIXED;
        break;
      case 0x9:
        this.width = 16;
        this.category = CAT_FIXED;
        break;
      case 0xA:
        this.width = 1;
        this.category = CAT_VARIABLE;
        break;
      case 0xB:
        this.width = 4;
        this.category = CAT_VARIABLE;
        break;
      case 0xC:
        this.width = 1;
        this.category = CAT_COMPOUND;
        break;
      case 0xD:
        this.width = 4;
        this.category = CAT_COMPOUND;
        break;
      case 0xE:
        this.width = 1;
        this.category = CAT_ARRAY;
        break;
      case 0xF:
        this.width = 4;
        this.category = CAT_ARRAY;
        break;
      default:
        //can't happen
        break;
    }

    if (props) {
      if (props.read) {
        this.read = props.read;
      }
      if (props.write) {
        this.write = props.write;
      }
      if (props.encoding) {
        this.encoding = props.encoding;
      }
    }

    const t = this;
    if (subcategory === 0x4) {
      // 'empty' types don't take a value
      this.create = () => {
        return new Typed(t, empty_value);
      };
    } else if (subcategory === 0xE || subcategory === 0xF) {
      this.create = (v, code, descriptor) => {
        return new Typed(t, v, code, descriptor);
      };
    } else {
      this.create = (v) => {
        return new Typed(t, v);
      };
    }
  }

  toString() {
    return `${this.name}#${hex(this.typecode)}`;
  }
}

let types: any = { 'by_code': {} };
Object.defineProperty(types, 'MAX_UINT', { value: 4294967295, writable: false, configurable: false });
Object.defineProperty(types, 'MAX_USHORT', { value: 65535, writable: false, configurable: false });

types.is_ulong = function (o: Typed): boolean {
  return is_one_of(o, [types.Ulong, types.Ulong0, types.SmallUlong]);
}
types.is_string = function (o: Typed): boolean {
  return is_one_of(o, [types.Str8, types.Str32]);
}
types.is_symbol = function (o: Typed): boolean {
  return is_one_of(o, [types.Sym8, types.Sym32]);
}
types.is_list = function (o: Typed): boolean {
  return is_one_of(o, [types.List0, types.List8, types.List32]);
}
types.is_map = function (o: Typed) {
  return is_one_of(o, [types.Map8, types.Map32]);
}

types.wrap_boolean = function (v: any): Typed {
  return v ? types.True() : types.False();
}
types.wrap_ulong = function (l: Buffer | number | Number) {
  if (Buffer.isBuffer(l)) {
    if (buffer_zero(l, 8, false)) return types.Ulong0();
    return buffer_zero(l, 7, false) ? types.SmallUlong(l[7]) : types.Ulong(l);
  } else {
    if (l === 0) return types.Ulong0();
    else return l > 255 ? types.Ulong(l) : types.SmallUlong(l);
  }
}
types.wrap_uint = function (l: number): Typed {
  if (l === 0) return types.Uint0();
  else return l > 255 ? types.Uint(l) : types.SmallUint(l);
}
types.wrap_ushort = function (l): Typed {
  return types.Ushort(l);
}
types.wrap_ubyte = function (l): Typed {
  return types.Ubyte(l);
}
types.wrap_long = function (l: Buffer | number): Typed {
  if (Buffer.isBuffer(l)) {
    let negFlag = (l[0] & 0x80) !== 0;
    if (buffer_zero(l, 7, negFlag) && (l[7] & 0x80) === (negFlag ? 0x80 : 0)) {
      return types.SmallLong(negFlag ? -((l[7] ^ 0xff) + 1) : l[7]);
    }
    return types.Long(l);
  } else {
    return l > 127 || l < -128 ? types.Long(l) : types.SmallLong(l);
  }
};
types.wrap_int = function (l: number): Typed {
  return l > 127 || l < -128 ? types.Int(l) : types.SmallInt(l);
}
types.wrap_short = function (l): Typed {
  return types.Short(l);
}
types.wrap_byte = function (l): Typed {
  return types.Byte(l);
}
types.wrap_float = function (l): Typed {
  return types.Float(l);
}
types.wrap_double = function (l): Typed {
  return types.Double(l);
}
types.wrap_timestamp = function (l): Typed {
  return types.Timestamp(l);
}
types.wrap_char = function (v): Typed {
  return types.CharUTF32(v);
}
types.wrap_uuid = function (v): Typed {
  return types.Uuid(v);
}
types.wrap_binary = function (s): Typed {
  return s.length > 255 ? types.Vbin32(s) : types.Vbin8(s);
}
types.wrap_string = function (s): Typed {
  return s.length > 255 ? types.Str32(s) : types.Str8(s);
}
types.wrap_symbol = function (s): Typed {
  return s.length > 255 ? types.Sym32(s) : types.Sym8(s);
}
types.wrap_list = function (l): Typed {
  if (l.length === 0) return types.List0();
  let items = l.map(types.wrap);
  return types.List32(items);
}
types.wrap_map = function (m: object, key_wrapper?: Function): Typed {
  let items: Typed[] = [];
  for (let k in m) {
    items.push(key_wrapper ? key_wrapper(k) : types.wrap(k));
    items.push(types.wrap(m[k]));
  }
  return types.Map32(items);
}
types.wrap_symbolic_map = function (m: object): Typed {
  return types.wrap_map(m, types.wrap_symbol);
}
types.wrap_array = function (l: any, code: number, descriptors): Typed {
  if (code) {
    return types.Array32(l, code, descriptors);
  } else {
    console.trace('An array must specify a type for its elements');
    throw new errors.TypeError('An array must specify a type for its elements');
  }
}
types.wrap = function (o: any): Typed {
  let t = typeof o;
  if (t === 'string') {
    return types.wrap_string(o);
  } else if (t === 'boolean') {
    return o ? types.True() : types.False();
  } else if (t === 'number' || o instanceof Number) {
    if (isNaN(o)) {
      throw new errors.TypeError('Cannot wrap NaN! ' + o);
    } else if (Math.floor(o) - o !== 0) {
      return types.Double(o);
    } else if (o > 0) {
      if (o < MAX_UINT) {
        return types.wrap_uint(o);
      } else {
        return types.wrap_ulong(o);
      }
    } else {
      if (o > MIN_INT) {
        return types.wrap_int(o);
      } else {
        return types.wrap_long(o);
      }
    }
  } else if (o instanceof Date) {
    return types.wrap_timestamp(o.getTime());
  } else if (o instanceof Typed) {
    return o;
  } else if (o instanceof Buffer) {
    return types.wrap_binary(o);
  } else if (t === 'undefined' || o === null) {
    return types.Null();
  } else if (Array.isArray(o)) {
    return types.wrap_list(o);
  } else {
    return types.wrap_map(o);
  }
}

types.wrap_described = function (value: any, descriptor: string | number | Number) {
  let result = types.wrap(value);
  if (descriptor) {
    if (typeof descriptor === 'string') {
      result = types.described(types.wrap_string(descriptor), result);
    } else if (typeof descriptor === 'number' || descriptor instanceof Number) {
      result = types.described(types.wrap_ulong((descriptor as number | Number)), result);
    }
  }
  return result;
}

types.wrap_message_id = function (o) {
  let t = typeof o;
  if (t === 'string') {
    return types.wrap_string(o);
  } else if (t === 'number' || o instanceof Number) {
    return types.wrap_ulong(o);
  } else if (Buffer.isBuffer(o)) {
    return types.wrap_uuid(o);
  } else {
    //TODO handle uuids
    throw new errors.TypeError('invalid message id:' + o);
  }
}

// TODO: not sure what is the type of descriptor and o over here and whether they are required or optional
types.described_nc = function (descriptor: any[] | any, o: any) {
  if (descriptor.length) {
    o.descriptor = descriptor.shift();
    return types.described(descriptor, o);
  } else {
    o.descriptor = descriptor;
    return o;
  }
}
types.described = types.described_nc;

types.unwrap_map_simple = function (o) {
  return mapify(o.value.map(function (i) { return types.unwrap(i, true); }));
}

types.unwrap = function (o, leave_described?: boolean) {
  if (o instanceof Typed) {
    if (o.descriptor) {
      let c = by_descriptor[o.descriptor.value];
      if (c) {
        return new c(o.value);
      } else if (leave_described) {
        return o;
      }
    }
    let u = types.unwrap(o.value, true);
    return types.is_map(o) ? mapify(u) : u;
  } else if (Array.isArray(o)) {
    return o.map(function (i) { return types.unwrap(i, true); });
  } else {
    return o;
  }
}

function buffer_uint8_ops(): BufferOps {
  return {
    'read': function (buffer, offset) { return buffer.readUInt8(offset); },
    'write': function (buffer, value, offset) { buffer.writeUInt8(value, offset); }
  };
}

function buffer_uint16be_ops(): BufferOps {
  return {
    'read': function (buffer, offset) { return buffer.readUInt16BE(offset); },
    'write': function (buffer, value, offset) { buffer.writeUInt16BE(value, offset); }
  };
}

function buffer_uint32be_ops(): BufferOps {
  return {
    'read': function (buffer, offset) { return buffer.readUInt32BE(offset); },
    'write': function (buffer, value, offset) { buffer.writeUInt32BE(value, offset); }
  };
}

function buffer_int8_ops(): BufferOps {
  return {
    'read': function (buffer, offset) { return buffer.readInt8(offset); },
    'write': function (buffer, value, offset) { buffer.writeInt8(value, offset); }
  };
}

function buffer_int16be_ops(): BufferOps {
  return {
    'read': function (buffer, offset) { return buffer.readInt16BE(offset); },
    'write': function (buffer, value, offset) { buffer.writeInt16BE(value, offset); }
  };
}

function buffer_int32be_ops(): BufferOps {
  return {
    'read': function (buffer, offset) { return buffer.readInt32BE(offset); },
    'write': function (buffer, value, offset) { buffer.writeInt32BE(value, offset); }
  };
}

function buffer_floatbe_ops(): BufferOps {
  return {
    'read': function (buffer, offset) { return buffer.readFloatBE(offset); },
    'write': function (buffer, value, offset) { buffer.writeFloatBE(value, offset); }
  };
}

function buffer_doublebe_ops(): BufferOps {
  return {
    'read': function (buffer, offset) { return buffer.readDoubleBE(offset); },
    'write': function (buffer, value, offset) { buffer.writeDoubleBE(value, offset); }
  };
}

function write_ulong(buffer: Buffer, value: any, offset: number): void {
  if ((typeof value) === 'number' || value instanceof Number) {
    let hi = Math.floor(value / MAX_UINT);
    let lo = value % MAX_UINT;
    buffer.writeUInt32BE(hi, offset);
    buffer.writeUInt32BE(lo, offset + 4);
  } else {
    value.copy(buffer, offset);
  }
}

function read_ulong(buffer: Buffer, offset: number): number | Buffer {
  let hi = buffer.readUInt32BE(offset);
  let lo = buffer.readUInt32BE(offset + 4);
  if (hi < 2097153) {
    return hi * MAX_UINT + lo;
  } else {
    return buffer.slice(offset, offset + 8);
  }
}

function write_long(buffer: Buffer, value: any, offset: number) {
  if ((typeof value) === 'number' || value instanceof Number) {
    let abs = Math.abs(value);
    let hi = Math.floor(abs / MAX_UINT);
    let lo = abs % MAX_UINT;
    buffer.writeInt32BE(hi, offset);
    buffer.writeUInt32BE(lo, offset + 4);
    if (value < 0) {
      let carry = 1;
      for (let i = 0; i < 8; i++) {
        let index = offset + (7 - i);
        let v = (buffer[index] ^ 0xFF) + carry;
        buffer[index] = v & 0xFF;
        carry = v >> 8;
      }
    }
  } else {
    value.copy(buffer, offset);
  }
}

function read_long(buffer: Buffer, offset: number): number | Buffer {
  const hi = buffer.readInt32BE(offset);
  const lo = buffer.readUInt32BE(offset + 4);
  if (hi < 2097153 && hi > -2097153) {
    return hi * MAX_UINT + lo;
  } else {
    return buffer.slice(offset, offset + 8);
  }
}

function define_type(name: string, typecode: number, annotations?: object, empty_value?: any): void {
  let t = new TypeDesc(name, typecode, annotations, empty_value);
  t.create.typecode = t.typecode;//hack
  types.by_code[t.typecode] = t;
  types[name] = t.create;
}

define_type('Null', 0x40, undefined, null);
define_type('Boolean', 0x56, buffer_uint8_ops());
define_type('True', 0x41, undefined, true);
define_type('False', 0x42, undefined, false);
define_type('Ubyte', 0x50, buffer_uint8_ops());
define_type('Ushort', 0x60, buffer_uint16be_ops());
define_type('Uint', 0x70, buffer_uint32be_ops());
define_type('SmallUint', 0x52, buffer_uint8_ops());
define_type('Uint0', 0x43, undefined, 0);
define_type('Ulong', 0x80, { 'write': write_ulong, 'read': read_ulong });
define_type('SmallUlong', 0x53, buffer_uint8_ops());
define_type('Ulong0', 0x44, undefined, 0);
define_type('Byte', 0x51, buffer_int8_ops());
define_type('Short', 0x61, buffer_int16be_ops());
define_type('Int', 0x71, buffer_int32be_ops());
define_type('SmallInt', 0x54, buffer_int8_ops());
define_type('Long', 0x81, { 'write': write_long, 'read': read_long });
define_type('SmallLong', 0x55, buffer_int8_ops());
define_type('Float', 0x72, buffer_floatbe_ops());
define_type('Double', 0x82, buffer_doublebe_ops());
define_type('Decimal32', 0x74);
define_type('Decimal64', 0x84);
define_type('Decimal128', 0x94);
define_type('CharUTF32', 0x73, buffer_uint32be_ops());
define_type('Timestamp', 0x83, { 'write': write_long, 'read': read_long });//TODO: convert to/from Date
define_type('Uuid', 0x98);//TODO: convert to/from stringified form?
define_type('Vbin8', 0xa0);
define_type('Vbin32', 0xb0);
define_type('Str8', 0xa1, { 'encoding': 'utf8' });
define_type('Str32', 0xb1, { 'encoding': 'utf8' });
define_type('Sym8', 0xa3, { 'encoding': 'ascii' });
define_type('Sym32', 0xb3, { 'encoding': 'ascii' });
define_type('List0', 0x45, undefined, []);
define_type('List8', 0xc0);
define_type('List32', 0xd0);
define_type('Map8', 0xc1);
define_type('Map32', 0xd1);
define_type('Array8', 0xe0);
define_type('Array32', 0xf0);

function is_one_of(o: Typed, typelist: TypeDesc[]): boolean {
  for (let i = 0; i < typelist.length; i++) {
    if (o.type.typecode === typelist[i].typecode) return true;
  }
  return false;
}
function buffer_zero(b: Buffer, len: number, neg: boolean): boolean {
  for (let i = 0; i < len && i < b.length; i++) {
    if (b[i] !== (neg ? 0xff : 0)) return false;
  }
  return true;
}


/**
 * Converts the list of keys and values that comprise an AMQP encoded
 * map into a proper javascript map/object.
 */
function mapify(elements) {
  let result = {};
  for (let i = 0; i + 1 < elements.length;) {
    result[elements[i++]] = elements[i++];
  }
  return result;
}

let by_descriptor = {};

/*
types.described = function (descriptor, typedvalue) {
    let o = Object.create(typedvalue);
    if (descriptor.length) {
        o.descriptor = descriptor.shift();
        return types.described(descriptor, o);
    } else {
        o.descriptor = descriptor;
        return o;
    }
};
*/


function get_type(code: number): TypeDesc {
  let type = types.by_code[code];
  if (!type) {
    throw new errors.TypeError('Unrecognised typecode: ' + hex(code));
  }
  return type;
}

class Reader {
  buffer: Buffer;
  position: number;
  constructor(buffer: Buffer) {
    this.buffer = buffer;
    this.position = 0;
  }
  read_typecode(): number {
    return this.read_uint(1);
  }

  read_uint(width: number): number {
    let current = this.position;
    this.position += width;
    if (width === 1) {
      return this.buffer.readUInt8(current);
    } else if (width === 2) {
      return this.buffer.readUInt16BE(current);
    } else if (width === 4) {
      return this.buffer.readUInt32BE(current);
    } else {
      throw new errors.TypeError('Unexpected width for uint ' + width);
    }
  }

  read_fixed_width(type: TypeDesc): number | Buffer {
    let current = this.position;
    this.position += type.width;
    if (type.read) {
      return type.read(this.buffer, current);
    } else {
      return this.buffer.slice(current, this.position);
    }
  }

  read_variable_width(type) {
    let size = this.read_uint(type.width);
    let slice = this.read_bytes(size);
    return type.encoding ? slice.toString(type.encoding) : slice;
  }

  read(): Typed {
    let constructor = this.read_constructor();
    let value = this.read_value(get_type(constructor.typecode));
    return constructor.descriptor ? types.described_nc(constructor.descriptor, value) : value;
  }

  read_constructor(): ArrayConstructor {
    let code = this.read_typecode();
    if (code === 0x00) {
      let d: Typed[] = [];
      d.push(this.read());
      let c = this.read_constructor();
      while (c.descriptor) {
        d.push(c.descriptor);
        c = this.read_constructor();
      }
      return { 'typecode': c.typecode, 'descriptor': d.length === 1 ? d[0] : d };
    } else {
      return { 'typecode': code };
    }
  }

  read_value(type: TypeDesc): Typed {
    if (type.width === 0) {
      return type.create();
    } else if (type.category === CAT_FIXED) {
      return type.create(this.read_fixed_width(type));
    } else if (type.category === CAT_VARIABLE) {
      return type.create(this.read_variable_width(type));
    } else if (type.category === CAT_COMPOUND) {
      return this.read_compound(type);
    } else if (type.category === CAT_ARRAY) {
      return this.read_array(type);
    } else {
      throw new errors.TypeError('Invalid category for type: ' + type);
    }
  }

  read_array_items(n: number, type: TypeDesc): Typed[] {
    let items: Typed[] = [];
    while (items.length < n) {
      items.push(this.read_value(type));
    }
    return items;
  }

  read_n(n) {
    let items = new Array(n);
    for (let i = 0; i < n; i++) {
      items[i] = this.read();
    }
    return items;
  }

  read_size_count(width: number) {
    return { 'size': this.read_uint(width), 'count': this.read_uint(width) };
  }

  read_compound(type: TypeDesc): Typed {
    let limits = this.read_size_count(type.width);
    return type.create(this.read_n(limits.count));
  }

  read_array(type: TypeDesc) {
    let limits = this.read_size_count(type.width);
    let constructor = this.read_constructor();
    return type.create(this.read_array_items(limits.count, get_type(constructor.typecode)), constructor.typecode, constructor.descriptor);
  }

  toString(): string {
    let s = 'buffer@' + this.position;
    if (this.position) s += ': ';
    for (let i = this.position; i < this.buffer.length; i++) {
      if (i > 0) s += ',';
      s += '0x' + Number(this.buffer[i]).toString(16);
    }
    return s;
  }

  reset(): void {
    this.position = 0;
  }

  skip(bytes: number): void {
    this.position += bytes;
  }

  read_bytes(bytes: number): Buffer {
    let current = this.position;
    this.position += bytes;
    return this.buffer.slice(current, this.position);
  }

  remaining(): number {
    return this.buffer.length - this.position;
  }
}
types.Reader = Reader;

class Writer {
  buffer: Buffer;
  position: number;
  constructor(buffer?: Buffer) {
    this.buffer = buffer ? buffer : new Buffer(1024);
    this.position = 0;
  }

  toBuffer(): Buffer {
    return this.buffer.slice(0, this.position);
  }

  ensure(length: number): void {
    if (this.buffer.length < length) {
      let bigger = new Buffer(max(this.buffer.length * 2, length));
      this.buffer.copy(bigger);
      this.buffer = bigger;
    }
  }

  write_typecode(code: number): void {
    this.write_uint(code, 1);
  }

  write_uint(value: number, width: number): number {
    const current = this.position;
    this.ensure(this.position + width);
    this.position += width;
    if (width === 1) {
      return this.buffer.writeUInt8(value, current);
    } else if (width === 2) {
      return this.buffer.writeUInt16BE(value, current);
    } else if (width === 4) {
      return this.buffer.writeUInt32BE(value, current);
    } else {
      throw new errors.TypeError('Unexpected width for uint ' + width);
    }
  }

  write_fixed_width(type: TypeDesc, value: any): void {
    const current: number = this.position;
    this.ensure(this.position + type.width);
    this.position += type.width;
    if (type.write) {
      type.write(this.buffer, value, current);
    } else if (value.copy) {
      value.copy(this.buffer, current);
    } else {
      throw new errors.TypeError('Cannot handle write for ' + type);
    }
  }

  write_variable_width(type: TypeDesc, value: any): void {
    const source: Buffer = type.encoding ? new Buffer(value, type.encoding) : new Buffer(value);//TODO: avoid creating new buffers
    this.write_uint(source.length, type.width);
    this.write_bytes(source);
  }

  write_bytes(source: Buffer): void {
    let current = this.position;
    this.ensure(this.position + source.length);
    this.position += source.length;
    source.copy(this.buffer, current);
  }

  write_constructor(typecode: number, descriptor?: Typed): void {
    if (descriptor) {
      this.write_typecode(0x00);
      this.write(descriptor);
    }
    this.write_typecode(typecode);
  }

  write(o: Typed): void {
    if (o.type === undefined) {
      throw new errors.TypeError('Cannot write ' + JSON.stringify(o));
    }
    this.write_constructor(o.type.typecode, o.descriptor);
    this.write_value(o.type, o.value, o.array_constructor as ArrayConstructor);
  }

  write_value(type: TypeDesc, value: any, constructor?: ArrayConstructor/*for arrays only*/): void {
    if (type.width === 0) {
      return;//nothing further to do
    } else if (type.category === CAT_FIXED) {
      this.write_fixed_width(type, value);
    } else if (type.category === CAT_VARIABLE) {
      this.write_variable_width(type, value);
    } else if (type.category === CAT_COMPOUND) {
      this.write_compound(type, value);
    } else if (type.category === CAT_ARRAY) {
      this.write_array(type, value, constructor as ArrayConstructor);
    } else {
      throw new errors.TypeError('Invalid category ' + type.category + ' for type: ' + type);
    }
  }

  backfill_size(width: number, saved: number): void {
    let gap = this.position - saved;
    this.position = saved;
    this.write_uint(gap - width, width);
    this.position += (gap - width);
  }

  write_compound(type, value): void {
    let saved = this.position;
    this.position += type.width;//skip size field
    this.write_uint(value.length, type.width);//count field
    for (let i = 0; i < value.length; i++) {
      if (value[i] === undefined || value[i] === null) {
        this.write(types.Null());
      } else {
        this.write(value[i]);
      }
    }
    this.backfill_size(type.width, saved);
  }

  write_array(type, value, constructor: ArrayConstructor): void {
    let saved = this.position;
    this.position += type.width;//skip size field
    this.write_uint(value.length, type.width);//count field
    this.write_constructor(constructor.typecode, constructor.descriptor);
    let ctype = get_type(constructor.typecode);
    for (let i = 0; i < value.length; i++) {
      this.write_value(ctype, value[i]);
    }
    this.backfill_size(type.width, saved);
  }

  toString(): string {
    let s = "buffer@" + this.position;
    if (this.position) s += ": ";
    for (let i = 0; i < this.position; i++) {
      if (i > 0) s += ",";
      s += ("00" + Number(this.buffer[i]).toString(16)).slice(-2);
    }
    return s;
  }

  skip(bytes: number): void {
    this.ensure(this.position + bytes);
    this.position += bytes;
  }

  clear(): void {
    this.buffer.fill(0x00);
    this.position = 0;
  }

  remaining(): number {
    return this.buffer.length - this.position;
  }
}
types.Writer = Writer;

function max(a: number, b: number): number {
  return a > b ? a : b;
}


function get_constructor(typename: string): { typecode: number } {
  if (typename === 'symbol') {
    return { typecode: types.Sym8.typecode };
  }
  throw new errors.TypeError('TODO: Array of type ' + typename + ' not yet supported');
}

function wrap_field(definition, instance): Typed {
  if (instance !== undefined && instance !== null) {
    if (Array.isArray(instance)) {
      if (!definition.multiple) {
        throw new errors.TypeError('Field ' + definition.name + ' does not support multiple values, got ' + JSON.stringify(instance));
      }
      let constructor = get_constructor(definition.type);
      // TODO: How can one provide constructor.descriptor if get_constructor only returns an object with one property typecode.
      return types.wrap_array(instance, constructor.typecode, (constructor as any).descriptor);
    } else if (definition.type === '*') {
      return instance;
    } else {
      let wrapper = types['wrap_' + definition.type];
      if (wrapper) {
        return wrapper(instance);
      } else {
        throw new errors.TypeError('No wrapper for field ' + definition.name + ' of type ' + definition.type);
      }
    }
  } else if (definition.mandatory) {
    throw new errors.TypeError('Field ' + definition.name + ' is mandatory');
  } else {
    return types.Null();
  }
}

function get_accessors(index, field_definition) {
  let getter;
  if (field_definition.type === '*') {
    getter = function () { return this.value[index]; };
  } else {
    getter = function () { return types.unwrap(this.value[index]); };
  }
  let setter = function (o) { this.value[index] = wrap_field(field_definition, o); };
  return { 'get': getter, 'set': setter, 'enumerable': true, 'configurable': false };
}

types.define_composite = function (def: any): any {
  let c: any = function (fields) {
    this.value = fields ? fields : [];
  };
  c.descriptor = {
    numeric: def.code,
    symbolic: 'amqp:' + def.name + ':list'
  };
  c.prototype.dispatch = function (target, frame) {
    target['on_' + def.name](frame);
  };
  //c.prototype.descriptor = c.descriptor.numeric;
  //c.prototype = Object.create(types.List8.prototype);
  for (let i = 0; i < def.fields.length; i++) {
    let f = def.fields[i];
    Object.defineProperty(c.prototype, f.name, get_accessors(i, f));
  }
  c.toString = function () {
    return def.name + '#' + Number(def.code).toString(16);
  };
  c.prototype.toJSON = function () {
    let o: any = {};
    o.type = c.toString();
    for (let f in this) {
      if (f !== 'value' && this[f]) {
        o[f] = this[f];
      }
    }
    return o;
  };
  c.create = function (fields) {
    let o = new c;
    for (let f in fields) {
      o[f] = fields[f];
    }
    return o;
  };
  c.prototype.described = function () {
    return types.described_nc(types.wrap_ulong(c.descriptor.numeric), types.wrap_list(this.value));
  };
  return c;
};

function add_type(def: any) {
  let c: any = types.define_composite(def);
  types['wrap_' + def.name] = function (fields) {
    return c.create(fields).described();
  };
  by_descriptor[Number(c.descriptor.numeric).toString(10)] = c;
  by_descriptor[c.descriptor.symbolic] = c;
}

add_type({
  name: 'error',
  code: 0x1d,
  fields: [
    { name: 'condition', type: 'symbol', mandatory: true },
    { name: 'description', type: 'string' },
    { name: 'info', type: 'map' }
  ]
});

module.exports = types;
