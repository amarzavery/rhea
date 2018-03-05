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

import * as types from "./types";
const amqp_types = new types.types()

export const basicFilter = {
  selector: function (s) {
    return { 'jms-selector': amqp_types.wrap_described(s, 0x468C00000004) };
  }
}


export const genericFilter = {
  selector: function (s, key) {
    return { key: amqp_types.wrap_described(s, 0x468C00000004) };
  }
}
