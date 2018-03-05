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
Object.defineProperty(exports, "__esModule", { value: true });
const errors = require("./errors");
const CAT_FIXED = 1;
const CAT_VARIABLE = 2;
const CAT_COMPOUND = 3;
const CAT_ARRAY = 4;
const MAX_UINT = 4294967296; // 2^32
const MIN_INT = -2147483647;
var TypeNames;
(function (TypeNames) {
    TypeNames["Null"] = "Null";
    TypeNames["Boolean"] = "Boolean";
    TypeNames["True"] = "True";
    TypeNames["False"] = "False";
    TypeNames["Ubyte"] = "Ubyte";
    TypeNames["Ushort"] = "Ushort";
    TypeNames["Uint"] = "Uint";
    TypeNames["SmallUint"] = "SmallUint";
    TypeNames["Uint0"] = "Uint0";
    TypeNames["Ulong"] = "Ulong";
    TypeNames["SmallUlong"] = "SmallUlong";
    TypeNames["Ulong0"] = "Ulong0";
    TypeNames["Byte"] = "Byte";
    TypeNames["Short"] = "Short";
    TypeNames["Int"] = "Int";
    TypeNames["SmallInt"] = "SmallInt";
    TypeNames["Long"] = "Long";
    TypeNames["SmallLong"] = "SmallLong";
    TypeNames["Float"] = "Float";
    TypeNames["Double"] = "Double";
    TypeNames["Decimal32"] = "Decimal32";
    TypeNames["Decimal64"] = "Decimal64";
    TypeNames["Decimal128"] = "Decimal128";
    TypeNames["CharUTF32"] = "CharUTF32";
    TypeNames["Timestamp"] = "Timestamp";
    TypeNames["Uuid"] = "Uuid";
    TypeNames["Vbin8"] = "Vbin8";
    TypeNames["Vbin32"] = "Vbin32";
    TypeNames["Str8"] = "Str8";
    TypeNames["Str32"] = "Str32";
    TypeNames["Sym8"] = "Sym8";
    TypeNames["Sym32"] = "Sym32";
    TypeNames["List0"] = "List0";
    TypeNames["List8"] = "List8";
    TypeNames["List32"] = "List32";
    TypeNames["Map8"] = "Map8";
    TypeNames["Map32"] = "Map32";
    TypeNames["Array8"] = "Array8";
    TypeNames["Array32"] = "Array32";
})(TypeNames = exports.TypeNames || (exports.TypeNames = {}));
class Typed {
    constructor(type, value, code, descriptor) {
        this.type = type;
        this.value = value;
        if (code) {
            this.array_constructor = { "typecode": code };
            if (descriptor) {
                this.array_constructor.descriptor = descriptor;
            }
        }
    }
    toString() {
        return this.value ? this.value.toString() : null;
    }
    toLocaleString() {
        return this.value ? this.value.toLocaleString() : null;
    }
    valueOf() {
        return this.value;
    }
    toJSON() {
        return this.value && this.value.toJSON ? this.value.toJSON() : this.value;
    }
}
exports.Typed = Typed;
/**
 * Converts a given value to the hexadecimal format.
 * @param {*} i - The value to be converted to hexadecimal format.
 * @returns {striing} - The converted hex string.
 */
function hex(i) {
    return Number(i).toString(16);
}
class TypeDesc {
    constructor(name, typecode, props, empty_value) {
        this.width = 0;
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
        }
        else if (subcategory === 0xE || subcategory === 0xF) {
            this.create = (v, code, descriptor) => {
                return new Typed(t, v, code, descriptor);
            };
        }
        else {
            this.create = (v) => {
                return new Typed(t, v);
            };
        }
    }
    toString() {
        return `${this.name}#${hex(this.typecode)}`;
    }
}
exports.TypeDesc = TypeDesc;
function define_type(obj, name, typecode, annotations, empty_value) {
    var t = new TypeDesc(name, typecode, annotations, empty_value);
    t.create.typecode = t.typecode; //hack
    obj.by_code[t.typecode] = t;
    obj[name] = t.create;
}
class types {
    constructor() {
        this.described = this.described_nc;
        this.MAX_UINT = MAX_UINT;
        this.MAX_USHORT = 65535;
        // this.Null = function () {
        //   let t = new TypeDesc('Null', 0x40, undefined, null);
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create();
        // }
        // this.Boolean = function (value: any) {
        //   let t = new TypeDesc('Boolean', 0x56, buffer_uint8_ops());
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create(value);
        // }
        // this.True = function () {
        //   let t = new TypeDesc('True', 0x41, undefined, true);
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create();
        // }
        // this.False = function () {
        //   let t = new TypeDesc('False', 0x42, undefined, false);
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create();
        // }
        // this.Ubyte = function (value: any) {
        //   let t = new TypeDesc('Ubyte', 0x50, buffer_uint8_ops());
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create(value);
        // }
        // this.Ushort = function (value: any) {
        //   let t = new TypeDesc('Ushort', 0x60, buffer_uint16be_ops());
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create(value);
        // }
        // this.Uint = function (value: any) {
        //   let t = new TypeDesc('Uint', 0x70, buffer_uint32be_ops());
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create(value);
        // }
        // this.SmallUint = function (value: any) {
        //   let t = new TypeDesc('SmallUint', 0x52, buffer_uint8_ops());
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create(value);
        // }
        // this.Uint0 = function () {
        //   let t = new TypeDesc('Uint0', 0x43, undefined, 0);
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create();
        // }
        this.Ulong = function (value) {
            let t = new TypeDesc('Ulong', 0x80, { 'write': write_ulong, 'read': read_ulong });
            t.create.typecode = t.typecode;
            this.by_code[t.typecode] = t;
            return t.create(value);
        };
        // this.SmallUlong = function (value: any) {
        //   let t = new TypeDesc('SmallUlong', 0x53, buffer_uint8_ops());
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create(value);
        // }
        // this.Ulong0 = function () {
        //   let t = new TypeDesc('Ulong0', 0x44, undefined, 0);
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create();
        // }
        // this.Byte = function (value: any) {
        //   let t = new TypeDesc('Byte', 0x51, buffer_int8_ops());
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create(value);
        // }
        // this.Short = function (value: any) {
        //   let t = new TypeDesc('Short', 0x61, buffer_int16be_ops());
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create(value);
        // }
        // this.Int = function (value: any) {
        //   let t = new TypeDesc('Int', 0x71, buffer_int32be_ops());
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create(value);
        // }
        // this.SmallInt = function (value: any) {
        //   let t = new TypeDesc('SmallInt', 0x54, buffer_int8_ops());
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create(value);
        // }
        // this.Long = function (value: any) {
        //   let t = new TypeDesc('Long', 0x81, { 'write': write_long, 'read': read_long });
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create(value);
        // }
        // this.SmallLong = function (value: any) {
        //   let t = new TypeDesc('SmallLong', 0x55, buffer_int8_ops());
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create(value);
        // }
        // this.Float = function (value: any) {
        //   let t = new TypeDesc('Float', 0x72, buffer_floatbe_ops());
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create(value);
        // }
        // this.Double = function (value: any) {
        //   let t = new TypeDesc('Double', 0x82, buffer_doublebe_ops());
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create(value);
        // }
        // this.Decimal32 = function (value: any) {
        //   let t = new TypeDesc('Decimal32', 0x74);
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create(value);
        // }
        // this.Decimal64 = function (value: any) {
        //   let t = new TypeDesc('Decimal64', 0x84);
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create(value);
        // }
        // this.Decimal128 = function (value: any) {
        //   let t = new TypeDesc('Decimal128', 0x94);
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create(value);
        // }
        // this.CharUTF32 = function (value: any) {
        //   let t = new TypeDesc('CharUTF32', 0x73, buffer_uint32be_ops());
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create(value);
        // }
        // this.Timestamp = function (value: any) {
        //   let t = new TypeDesc('Timestamp', 0x83, { 'write': write_long, 'read': read_long });
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create(value);
        // }
        // this.Uuid = function (value: any) {
        //   let t = new TypeDesc('Uuid', 0x98);
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create(value);
        // }
        // this.Vbin8 = function (value: any) {
        //   let t = new TypeDesc('Vbin8', 0xa0);
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create(value);
        // }
        // this.Vbin32 = function (value: any) {
        //   let t = new TypeDesc('Vbin32', 0xb0);
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create(value);
        // }
        // this.Str8 = function (value: any) {
        //   let t = new TypeDesc('Str8', 0xa1, { 'encoding': 'utf8' });
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create(value);
        // }
        // this.Str32 = function (value: any) {
        //   let t = new TypeDesc('Str32', 0xb1, { 'encoding': 'utf8' });
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create(value);
        // }
        // this.Sym8 = function (value: any) {
        //   let t = new TypeDesc('Sym8', 0xa3, { 'encoding': 'ascii' });
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create(value);
        // }
        // this.Sym32 = function (value: any) {
        //   let t = new TypeDesc('Sym32', 0xb3, { 'encoding': 'ascii' });
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create(value);
        // }
        // this.List0 = function () {
        //   let t = new TypeDesc('List0', 0x45, undefined, []);
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create();
        // }
        // this.List8 = function (value: any) {
        //   let t = new TypeDesc('List8', 0xc0);
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create(value);
        // }
        // this.List32 = function (value: any) {
        //   let t = new TypeDesc('List32', 0xd0);
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create(value);
        // }
        // this.Map8 = function (value: any) {
        //   let t = new TypeDesc('Map8', 0xc1);
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create(value);
        // }
        // this.Map32 = function (value: any) {
        //   let t = new TypeDesc('Map32', 0xd1);
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create(value);
        // }
        // this.Array8 = function (value: any, code?: number, descriptor?: any) {
        //   let t = new TypeDesc('Array8', 0xe0);
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create(value, code, descriptor);
        // }
        // this.Array32 = function (value: any, code?: number, descriptor?: any) {
        //   let t = new TypeDesc('Array32', 0xf0);
        //   t.create.typecode = t.typecode;
        //   this.by_code[t.typecode] = t;
        //   return t.create(value, code, descriptor);
        // }
        this.by_code = {};
        define_type(this, 'Null', 0x40, undefined, null);
        define_type(this, 'Boolean', 0x56, buffer_uint8_ops());
        define_type(this, 'True', 0x41, undefined, true);
        define_type(this, 'False', 0x42, undefined, false);
        define_type(this, 'Ubyte', 0x50, buffer_uint8_ops());
        define_type(this, 'Ushort', 0x60, buffer_uint16be_ops());
        define_type(this, 'Uint', 0x70, buffer_uint32be_ops());
        define_type(this, 'SmallUint', 0x52, buffer_uint8_ops());
        define_type(this, 'Uint0', 0x43, undefined, 0);
        define_type(this, 'Ulong', 0x80, { 'write': write_ulong, 'read': read_ulong });
        define_type(this, 'SmallUlong', 0x53, buffer_uint8_ops());
        define_type(this, 'Ulong0', 0x44, undefined, 0);
        define_type(this, 'Byte', 0x51, buffer_int8_ops());
        define_type(this, 'Short', 0x61, buffer_int16be_ops());
        define_type(this, 'Int', 0x71, buffer_int32be_ops());
        define_type(this, 'SmallInt', 0x54, buffer_int8_ops());
        define_type(this, 'Long', 0x81, { 'write': write_long, 'read': read_long });
        define_type(this, 'SmallLong', 0x55, buffer_int8_ops());
        define_type(this, 'Float', 0x72, buffer_floatbe_ops());
        define_type(this, 'Double', 0x82, buffer_doublebe_ops());
        define_type(this, 'Decimal32', 0x74);
        define_type(this, 'Decimal64', 0x84);
        define_type(this, 'Decimal128', 0x94);
        define_type(this, 'CharUTF32', 0x73, buffer_uint32be_ops());
        define_type(this, 'Timestamp', 0x83, { 'write': write_long, 'read': read_long }); //TODO: convert to/from Date
        define_type(this, 'Uuid', 0x98); //TODO: convert to/from stringified form?
        define_type(this, 'Vbin8', 0xa0);
        define_type(this, 'Vbin32', 0xb0);
        define_type(this, 'Str8', 0xa1, { 'encoding': 'utf8' });
        define_type(this, 'Str32', 0xb1, { 'encoding': 'utf8' });
        define_type(this, 'Sym8', 0xa3, { 'encoding': 'ascii' });
        define_type(this, 'Sym32', 0xb3, { 'encoding': 'ascii' });
        define_type(this, 'List0', 0x45, undefined, []);
        define_type(this, 'List8', 0xc0);
        define_type(this, 'List32', 0xd0);
        define_type(this, 'Map8', 0xc1);
        define_type(this, 'Map32', 0xd1);
        define_type(this, 'Array8', 0xe0);
        define_type(this, 'Array32', 0xf0);
    }
    is_ulon(o) {
        return is_one_of(o, [this.Ulong, this.Ulong0, this.SmallUlong]);
    }
    is_string(o) {
        return is_one_of(o, [this.Str8, this.Str32]);
    }
    is_symbol(o) {
        return is_one_of(o, [this.Sym8, this.Sym32]);
    }
    is_list(o) {
        return is_one_of(o, [this.List0, this.List8, this.List32]);
    }
    is_map(o) {
        return is_one_of(o, [this.Map8, this.Map32]);
    }
    wrap_boolean(v) {
        return v ? this.True() : this.False();
    }
    wrap_ulong(l) {
        if (Buffer.isBuffer(l)) {
            if (buffer_zero(l, 8, false))
                return this.Ulong0();
            return buffer_zero(l, 7, false) ? this.SmallUlong(l[7]) : this.Ulong(l);
        }
        else {
            if (l === 0)
                return this.Ulong0();
            else
                return l > 255 ? this.Ulong(l) : this.SmallUlong(l);
        }
    }
    wrap_uint(l) {
        if (l === 0)
            return this.Uint0();
        else
            return l > 255 ? this.Uint(l) : this.SmallUint(l);
    }
    wrap_ushort(l) {
        return this.Ushort(l);
    }
    wrap_ubyte(l) {
        return this.Ubyte(l);
    }
    wrap_long(l) {
        if (Buffer.isBuffer(l)) {
            let negFlag = (l[0] & 0x80) !== 0;
            if (buffer_zero(l, 7, negFlag) && (l[7] & 0x80) === (negFlag ? 0x80 : 0)) {
                return this.SmallLong(negFlag ? -((l[7] ^ 0xff) + 1) : l[7]);
            }
            return this.Long(l);
        }
        else {
            return l > 127 || l < -128 ? this.Long(l) : this.SmallLong(l);
        }
    }
    ;
    wrap_int(l) {
        return l > 127 || l < -128 ? this.Int(l) : this.SmallInt(l);
    }
    wrap_short(l) {
        return this.Short(l);
    }
    wrap_byte(l) {
        return this.Byte(l);
    }
    wrap_float(l) {
        return this.Float(l);
    }
    wrap_double(l) {
        return this.Double(l);
    }
    wrap_timestamp(l) {
        return this.Timestamp(l);
    }
    wrap_char(v) {
        return this.CharUTF32(v);
    }
    wrap_uuid(v) {
        return this.Uuid(v);
    }
    wrap_binary(s) {
        return s.length > 255 ? this.Vbin32(s) : this.Vbin8(s);
    }
    wrap_string(s) {
        return s.length > 255 ? this.Str32(s) : this.Str8(s);
    }
    wrap_symbol(s) {
        return s.length > 255 ? this.Sym32(s) : this.Sym8(s);
    }
    wrap_list(l) {
        if (l.length === 0)
            return this.List0();
        let items = l.map(this.wrap);
        return this.List32(items);
    }
    wrap_map(m, key_wrapper) {
        let items = [];
        for (let k in m) {
            items.push(key_wrapper ? key_wrapper(k) : this.wrap(k));
            items.push(this.wrap(m[k]));
        }
        return this.Map32(items);
    }
    wrap_symbolic_map(m) {
        return this.wrap_map(m, this.wrap_symbol);
    }
    wrap_array(l, code, descriptors) {
        if (code) {
            return this.Array32(l, code, descriptors);
        }
        else {
            console.trace('An array must specify a type for its elements');
            throw new errors.TypeError('An array must specify a type for its elements');
        }
    }
    wrap(o) {
        let t = typeof o;
        if (t === 'string') {
            return this.wrap_string(o);
        }
        else if (t === 'boolean') {
            return o ? this.True() : this.False();
        }
        else if (t === 'number' || o instanceof Number) {
            if (isNaN(o)) {
                throw new errors.TypeError('Cannot wrap NaN! ' + o);
            }
            else if (Math.floor(o) - o !== 0) {
                return this.Double(o);
            }
            else if (o > 0) {
                if (o < MAX_UINT) {
                    return this.wrap_uint(o);
                }
                else {
                    return this.wrap_ulong(o);
                }
            }
            else {
                if (o > MIN_INT) {
                    return this.wrap_int(o);
                }
                else {
                    return this.wrap_long(o);
                }
            }
        }
        else if (o instanceof Date) {
            return this.wrap_timestamp(o.getTime());
        }
        else if (o instanceof Typed) {
            return o;
        }
        else if (o instanceof Buffer) {
            return this.wrap_binary(o);
        }
        else if (t === 'undefined' || o === null) {
            return this.Null();
        }
        else if (Array.isArray(o)) {
            return this.wrap_list(o);
        }
        else {
            return this.wrap_map(o);
        }
    }
    wrap_described(value, descriptor) {
        let result = this.wrap(value);
        if (descriptor) {
            if (typeof descriptor === 'string') {
                result = this.described(this.wrap_string(descriptor), result);
            }
            else if (typeof descriptor === 'number' || descriptor instanceof Number) {
                result = this.described(this.wrap_ulong(descriptor), result);
            }
        }
        return result;
    }
    wrap_message_id(o) {
        let t = typeof o;
        if (t === 'string') {
            return this.wrap_string(o);
        }
        else if (t === 'number' || o instanceof Number) {
            return this.wrap_ulong(o);
        }
        else if (Buffer.isBuffer(o)) {
            return this.wrap_uuid(o);
        }
        else {
            //TODO handle uuids
            throw new errors.TypeError('invalid message id:' + o);
        }
    }
    // TODO: not sure what is the type of descriptor and o over here and whether they are required or optional
    described_nc(descriptor, o) {
        if (descriptor.length) {
            o.descriptor = descriptor.shift();
            return this.described(descriptor, o);
        }
        else {
            o.descriptor = descriptor;
            return o;
        }
    }
    unwrap_map_simple(o) {
        return mapify(o.value.map((i) => { return this.unwrap(i, true); }));
    }
    unwrap(o, leave_described) {
        if (o instanceof Typed) {
            if (o.descriptor) {
                let c = by_descriptor[o.descriptor.value];
                if (c) {
                    return new c(o.value);
                }
                else if (leave_described) {
                    return o;
                }
            }
            let u = this.unwrap(o.value, true);
            return this.is_map(o) ? mapify(u) : u;
        }
        else if (Array.isArray(o)) {
            return o.map((i) => { return this.unwrap(i, true); });
        }
        else {
            return o;
        }
    }
    define_composite(def) {
        const self = this;
        class c {
            constructor(fields) {
                this.value = fields ? fields : [];
            }
            dispatch(target, frame) {
                target['on_' + def.name](frame);
            }
            static toString() {
                return def.name + '#' + Number(def.code).toString(16);
            }
            toJSON() {
                let o = {};
                o.type = c.toString();
                for (let f in this) {
                    if (f !== 'value' && this[f]) {
                        o[f] = this[f];
                    }
                }
                return o;
            }
            static create(fields) {
                let o = new c();
                for (let f in fields) {
                    o[f] = fields[f];
                }
                return o;
            }
            ;
            described() {
                return self.described_nc(self.wrap_ulong(c.descriptor.numeric), self.wrap_list(this.value));
            }
        }
        c.descriptor = {
            numeric: def.code,
            symbolic: 'amqp:' + def.name + ':list'
        };
        //c.prototype.descriptor = c.descriptor.numeric;
        //c.prototype = Object.create(self.List8.prototype);
        for (let i = 0; i < def.fields.length; i++) {
            let f = def.fields[i];
            Object.defineProperty(c.prototype, f.name, get_accessors(i, f));
        }
        return c;
    }
}
exports.types = types;
//let ty = new types();
class Reader {
    constructor(buffer) {
        this.buffer = buffer;
        this.position = 0;
    }
    read_typecode() {
        return this.read_uint(1);
    }
    read_uint(width) {
        let current = this.position;
        this.position += width;
        if (width === 1) {
            return this.buffer.readUInt8(current);
        }
        else if (width === 2) {
            return this.buffer.readUInt16BE(current);
        }
        else if (width === 4) {
            return this.buffer.readUInt32BE(current);
        }
        else {
            throw new errors.TypeError('Unexpected width for uint ' + width);
        }
    }
    read_fixed_width(type) {
        let current = this.position;
        this.position += type.width;
        if (type.read) {
            return type.read(this.buffer, current);
        }
        else {
            return this.buffer.slice(current, this.position);
        }
    }
    read_variable_width(type) {
        let size = this.read_uint(type.width);
        let slice = this.read_bytes(size);
        return type.encoding ? slice.toString(type.encoding) : slice;
    }
    read() {
        let constructor = this.read_constructor();
        let value = this.read_value(get_type(constructor.typecode));
        return constructor.descriptor ? types.prototype.described_nc(constructor.descriptor, value) : value;
    }
    read_constructor() {
        let code = this.read_typecode();
        if (code === 0x00) {
            let d = [];
            d.push(this.read());
            let c = this.read_constructor();
            while (c.descriptor) {
                d.push(c.descriptor);
                c = this.read_constructor();
            }
            return { 'typecode': c.typecode, 'descriptor': d.length === 1 ? d[0] : d };
        }
        else {
            return { 'typecode': code };
        }
    }
    read_value(type) {
        if (type.width === 0) {
            return type.create();
        }
        else if (type.category === CAT_FIXED) {
            return type.create(this.read_fixed_width(type));
        }
        else if (type.category === CAT_VARIABLE) {
            return type.create(this.read_variable_width(type));
        }
        else if (type.category === CAT_COMPOUND) {
            return this.read_compound(type);
        }
        else if (type.category === CAT_ARRAY) {
            return this.read_array(type);
        }
        else {
            throw new errors.TypeError('Invalid category for type: ' + type);
        }
    }
    read_array_items(n, type) {
        let items = [];
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
    read_size_count(width) {
        return { 'size': this.read_uint(width), 'count': this.read_uint(width) };
    }
    read_compound(type) {
        let limits = this.read_size_count(type.width);
        return type.create(this.read_n(limits.count));
    }
    read_array(type) {
        let limits = this.read_size_count(type.width);
        let constructor = this.read_constructor();
        return type.create(this.read_array_items(limits.count, get_type(constructor.typecode)), constructor.typecode, constructor.descriptor);
    }
    toString() {
        let s = 'buffer@' + this.position;
        if (this.position)
            s += ': ';
        for (let i = this.position; i < this.buffer.length; i++) {
            if (i > 0)
                s += ',';
            s += '0x' + Number(this.buffer[i]).toString(16);
        }
        return s;
    }
    reset() {
        this.position = 0;
    }
    skip(bytes) {
        this.position += bytes;
    }
    read_bytes(bytes) {
        let current = this.position;
        this.position += bytes;
        return this.buffer.slice(current, this.position);
    }
    remaining() {
        return this.buffer.length - this.position;
    }
}
class Writer {
    constructor(buffer) {
        this.buffer = buffer ? buffer : new Buffer(1024);
        this.position = 0;
    }
    toBuffer() {
        return this.buffer.slice(0, this.position);
    }
    ensure(length) {
        if (this.buffer.length < length) {
            let bigger = new Buffer(max(this.buffer.length * 2, length));
            this.buffer.copy(bigger);
            this.buffer = bigger;
        }
    }
    write_typecode(code) {
        this.write_uint(code, 1);
    }
    write_uint(value, width) {
        const current = this.position;
        this.ensure(this.position + width);
        this.position += width;
        if (width === 1) {
            return this.buffer.writeUInt8(value, current);
        }
        else if (width === 2) {
            return this.buffer.writeUInt16BE(value, current);
        }
        else if (width === 4) {
            return this.buffer.writeUInt32BE(value, current);
        }
        else {
            throw new errors.TypeError('Unexpected width for uint ' + width);
        }
    }
    write_fixed_width(type, value) {
        const current = this.position;
        this.ensure(this.position + type.width);
        this.position += type.width;
        if (type.write) {
            type.write(this.buffer, value, current);
        }
        else if (value.copy) {
            value.copy(this.buffer, current);
        }
        else {
            throw new errors.TypeError('Cannot handle write for ' + type);
        }
    }
    write_variable_width(type, value) {
        const source = type.encoding ? new Buffer(value, type.encoding) : new Buffer(value); //TODO: avoid creating new buffers
        this.write_uint(source.length, type.width);
        this.write_bytes(source);
    }
    write_bytes(source) {
        let current = this.position;
        this.ensure(this.position + source.length);
        this.position += source.length;
        source.copy(this.buffer, current);
    }
    write_constructor(typecode, descriptor) {
        if (descriptor) {
            this.write_typecode(0x00);
            this.write(descriptor);
        }
        this.write_typecode(typecode);
    }
    write(o) {
        if (o.type === undefined) {
            throw new errors.TypeError('Cannot write ' + JSON.stringify(o));
        }
        this.write_constructor(o.type.typecode, o.descriptor);
        this.write_value(o.type, o.value, o.array_constructor);
    }
    write_value(type, value, constructor /*for arrays only*/) {
        if (type.width === 0) {
            return; //nothing further to do
        }
        else if (type.category === CAT_FIXED) {
            this.write_fixed_width(type, value);
        }
        else if (type.category === CAT_VARIABLE) {
            this.write_variable_width(type, value);
        }
        else if (type.category === CAT_COMPOUND) {
            this.write_compound(type, value);
        }
        else if (type.category === CAT_ARRAY) {
            this.write_array(type, value, constructor);
        }
        else {
            throw new errors.TypeError('Invalid category ' + type.category + ' for type: ' + type);
        }
    }
    backfill_size(width, saved) {
        let gap = this.position - saved;
        this.position = saved;
        this.write_uint(gap - width, width);
        this.position += (gap - width);
    }
    write_compound(type, value) {
        let saved = this.position;
        this.position += type.width; //skip size field
        this.write_uint(value.length, type.width); //count field
        for (let i = 0; i < value.length; i++) {
            if (value[i] === undefined || value[i] === null) {
                this.write(types.prototype.Null());
            }
            else {
                this.write(value[i]);
            }
        }
        this.backfill_size(type.width, saved);
    }
    write_array(type, value, constructor) {
        let saved = this.position;
        this.position += type.width; //skip size field
        this.write_uint(value.length, type.width); //count field
        this.write_constructor(constructor.typecode, constructor.descriptor);
        let ctype = get_type(constructor.typecode);
        for (let i = 0; i < value.length; i++) {
            this.write_value(ctype, value[i]);
        }
        this.backfill_size(type.width, saved);
    }
    toString() {
        let s = "buffer@" + this.position;
        if (this.position)
            s += ": ";
        for (let i = 0; i < this.position; i++) {
            if (i > 0)
                s += ",";
            s += ("00" + Number(this.buffer[i]).toString(16)).slice(-2);
        }
        return s;
    }
    skip(bytes) {
        this.ensure(this.position + bytes);
        this.position += bytes;
    }
    clear() {
        this.buffer.fill(0x00);
        this.position = 0;
    }
    remaining() {
        return this.buffer.length - this.position;
    }
}
types.prototype.Reader = Reader;
types.prototype.Writer = Writer;
// TODO: Not sure if we need this. However adding for backwards compat.
const ty = new types();
types.prototype.by_code = ty.by_code;
for (let prop of Object.getOwnPropertyNames(ty)) {
    if (!types[prop])
        types[prop] = ty[prop];
    if (!types.prototype[prop])
        types.prototype[prop] = ty[prop];
}
function buffer_uint8_ops() {
    return {
        'read': function (buffer, offset) { return buffer.readUInt8(offset); },
        'write': function (buffer, value, offset) { buffer.writeUInt8(value, offset); }
    };
}
function buffer_uint16be_ops() {
    return {
        'read': function (buffer, offset) { return buffer.readUInt16BE(offset); },
        'write': function (buffer, value, offset) { buffer.writeUInt16BE(value, offset); }
    };
}
function buffer_uint32be_ops() {
    return {
        'read': function (buffer, offset) { return buffer.readUInt32BE(offset); },
        'write': function (buffer, value, offset) { buffer.writeUInt32BE(value, offset); }
    };
}
function buffer_int8_ops() {
    return {
        'read': function (buffer, offset) { return buffer.readInt8(offset); },
        'write': function (buffer, value, offset) { buffer.writeInt8(value, offset); }
    };
}
function buffer_int16be_ops() {
    return {
        'read': function (buffer, offset) { return buffer.readInt16BE(offset); },
        'write': function (buffer, value, offset) { buffer.writeInt16BE(value, offset); }
    };
}
function buffer_int32be_ops() {
    return {
        'read': function (buffer, offset) { return buffer.readInt32BE(offset); },
        'write': function (buffer, value, offset) { buffer.writeInt32BE(value, offset); }
    };
}
function buffer_floatbe_ops() {
    return {
        'read': function (buffer, offset) { return buffer.readFloatBE(offset); },
        'write': function (buffer, value, offset) { buffer.writeFloatBE(value, offset); }
    };
}
function buffer_doublebe_ops() {
    return {
        'read': function (buffer, offset) { return buffer.readDoubleBE(offset); },
        'write': function (buffer, value, offset) { buffer.writeDoubleBE(value, offset); }
    };
}
function write_ulong(buffer, value, offset) {
    if ((typeof value) === 'number' || value instanceof Number) {
        let hi = Math.floor(value / MAX_UINT);
        let lo = value % MAX_UINT;
        buffer.writeUInt32BE(hi, offset);
        buffer.writeUInt32BE(lo, offset + 4);
    }
    else {
        value.copy(buffer, offset);
    }
}
function read_ulong(buffer, offset) {
    let hi = buffer.readUInt32BE(offset);
    let lo = buffer.readUInt32BE(offset + 4);
    if (hi < 2097153) {
        return hi * MAX_UINT + lo;
    }
    else {
        return buffer.slice(offset, offset + 8);
    }
}
function write_long(buffer, value, offset) {
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
    }
    else {
        value.copy(buffer, offset);
    }
}
function read_long(buffer, offset) {
    const hi = buffer.readInt32BE(offset);
    const lo = buffer.readUInt32BE(offset + 4);
    if (hi < 2097153 && hi > -2097153) {
        return hi * MAX_UINT + lo;
    }
    else {
        return buffer.slice(offset, offset + 8);
    }
}
function is_one_of(o, typelist) {
    for (let i = 0; i < typelist.length; i++) {
        if (o.type.typecode === typelist[i].typecode)
            return true;
    }
    return false;
}
function buffer_zero(b, len, neg) {
    for (let i = 0; i < len && i < b.length; i++) {
        if (b[i] !== (neg ? 0xff : 0))
            return false;
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
function get_type(code) {
    let type = types.prototype.by_code[code];
    if (!type) {
        throw new errors.TypeError('Unrecognised typecode: ' + hex(code));
    }
    return type;
}
function max(a, b) {
    return a > b ? a : b;
}
function get_constructor(typename) {
    if (typename === 'symbol') {
        return { typecode: types.prototype.Sym8.typecode };
    }
    throw new errors.TypeError('TODO: Array of type ' + typename + ' not yet supported');
}
function wrap_field(definition, instance) {
    if (instance !== undefined && instance !== null) {
        if (Array.isArray(instance)) {
            if (!definition.multiple) {
                throw new errors.TypeError('Field ' + definition.name + ' does not support multiple values, got ' + JSON.stringify(instance));
            }
            let constructor = get_constructor(definition.type);
            // TODO: How can one provide constructor.descriptor if get_constructor only returns an object with one property typecode.
            return types.prototype.wrap_array(instance, constructor.typecode, constructor.descriptor);
        }
        else if (definition.type === '*') {
            return instance;
        }
        else {
            let wrapper = types.prototype['wrap_' + definition.type];
            if (wrapper) {
                return wrapper(instance);
            }
            else {
                throw new errors.TypeError('No wrapper for field ' + definition.name + ' of type ' + definition.type);
            }
        }
    }
    else if (definition.mandatory) {
        throw new errors.TypeError('Field ' + definition.name + ' is mandatory');
    }
    else {
        return types.prototype.Null();
    }
}
function get_accessors(index, field_definition) {
    let getter;
    if (field_definition.type === '*') {
        getter = () => { return this.value[index]; };
    }
    else {
        getter = () => { return types.prototype.unwrap(this.value[index]); };
    }
    let setter = (o) => { this.value[index] = wrap_field(field_definition, o); };
    return { 'get': getter, 'set': setter, 'enumerable': true, 'configurable': false };
}
function add_type(def) {
    let c = types.prototype.define_composite(def);
    types.prototype['wrap_' + def.name] = function (fields) {
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
//# sourceMappingURL=types.js.map