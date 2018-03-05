/// <reference types="node" />
export declare function generate_uuid(): string;
export declare function uuid4(): Buffer;
export declare function uuid_to_string(buffer: Buffer): string;
export declare function clone(o: any): any;
export declare function and(f: Function, g: Function): Function;
export declare function is_sender(o: any): boolean;
export declare function is_receiver(o: any): boolean;
export declare function sender_filter(filter: any): Function;
export declare function receiver_filter(filter: any): Function;
export declare function is_defined(field: any): boolean;
