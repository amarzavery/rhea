"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
class ProtocolError extends Error {
    constructor(message) {
        super();
        this.name = "ProtocolError";
        this.message = message;
        this.name = "ProtocolError";
    }
}
exports.ProtocolError = ProtocolError;
class TypeError extends ProtocolError {
    constructor(message) {
        super(message);
        this.name = "TypeError";
        this.message = message;
        this.name = "TypeError";
    }
}
exports.TypeError = TypeError;
class ConnectionError extends Error {
    constructor(message, condition, connection) {
        super(message);
        this.name = "ConnectionError";
        this.message = message;
        this.name = "ConnectionError";
        this.condition = condition;
        this.description = message;
        this.connection = connection;
    }
}
exports.ConnectionError = ConnectionError;
//# sourceMappingURL=errors.js.map