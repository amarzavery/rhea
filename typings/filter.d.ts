import * as types from "./types";
export declare const basicFilter: {
    selector: (s: any) => {
        'jms-selector': types.Typed;
    };
};
export declare const genericFilter: {
    selector: (s: any, key: any) => {
        key: types.Typed;
    };
};
