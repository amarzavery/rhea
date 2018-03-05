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

export class EndpointState {
  local_open: boolean = false;
  remote_open: boolean = false;
  open_requests: number = 0;
  close_requests: number = 0;
  initialised: boolean = false;

  constructor() {
    this.init();
  }

  init() {
    this.local_open = false;
    this.remote_open = false;
    this.open_requests = 0;
    this.close_requests = 0;
    this.initialised = false;
  };

  open(): boolean {
    this.initialised = true;
    if (!this.local_open) {
      this.local_open = true;
      this.open_requests++;
      return true;
    } else {
      return false;
    }
  };

  close(): boolean {
    if (this.local_open) {
      this.local_open = false;
      this.close_requests++;
      return true;
    } else {
      return false;
    }
  };

  disconnected(): void {
    var was_initialised = this.initialised;
    var was_open = this.local_open;
    this.init();
    this.initialised = was_initialised;
    if (was_open) {
      this.open();
    } else {
      this.close();
    }
  };

  remote_opened(): boolean {
    if (!this.remote_open) {
      this.remote_open = true;
      return true;
    } else {
      return false;
    }
  };

  remote_closed(): boolean {
    if (this.remote_open) {
      this.remote_open = false;
      return true;
    } else {
      return false;
    }
  };

  is_open(): boolean {
    return this.local_open && this.remote_open;
  };

  is_closed(): boolean {
    return this.initialised && !this.local_open && !this.remote_open;
  };

  has_settled(): boolean {
    return this.open_requests === 0 && this.close_requests === 0;
  };

  need_open(): boolean {
    if (this.open_requests > 0) {
      this.open_requests--;
      return true;
    } else {
      return false;
    }
  };

  need_close(): boolean {
    if (this.close_requests > 0) {
      this.close_requests--;
      return true;
    } else {
      return false;
    }
  };
}
