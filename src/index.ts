/**
 * Does state change too quickly? 
 * With stage-transition-buffer, the minimum duration of any state can be secured.
 */

/**
 * The internal storage item in the buffer
 * @property value the new value pushed to the buffer
 * @property minDuration the minimum duration time given in milliseconds. If there is a new value pushed, the current value will stay until the min-duration time passed if not yet.
 *
 * @property timestamp the timestamp in millisconds, which recorded when the value gets pushed
 */
export interface BufferedItem<T> {
  value: T;
  minDuration: number;
  timestamp: number;
}

/**
 * A generic object to buffer the value changes for a minimum duration.
 *  Example usage:
 *  ```javascript
 * import { StateBuffer } from 'state-transition-buffer';
 * let connectionState = new StateBuffer({
 *   defaultMinDuration: 1000,
 *   removeLastDuplicated: true
 * });
 * connectionState.push("connecting...", 500); 
 * connectionState.push("connected", 2000); 
 * connectionState.push();
 * connectionState.push("connection lost"); 
 * connectionState.push("re-connecting...", 500); 
 * connectionState.push("connection failed");
 * let currentConnectionStates = connectionState.get();
 * let bufferedItems = connectionState.bufferedItems;
 * ```
 */
export class StateBuffer<T> {
  public bufferedItems = new Array<BufferedItem<T>>();
  public removeLastDuplicated?: boolean = false;
  public defaultMinDuration?: number;

  /**
   * Constuct the value buffer with two optional options:
   * @param defaultMinDuration optinal,used if no minDuration parameter given on push
   * @param removeLastDuplicated optinal, if true, will try to remove the last value in the buffer immediately if it DEEP equals with the new value
   */
  public StateBuffer(options?: {
    defaultMinDuration?: number;
    removeLastDuplicated?: boolean;
  }) {
    this.defaultMinDuration = options?.defaultMinDuration;
    this.removeLastDuplicated = options?.removeLastDuplicated;
  }

  get(): T[] {
    return this.bufferedItems.map(item => item.value);
  }

  public size() {
    return this.bufferedItems.length;
  }

  public push(value?: T, minDuration?: number) {
    const now = Date.now();
    minDuration = minDuration ?? this.defaultMinDuration ?? 0;

    // try remove the last duplicated message if the option enabled
    let items =
      value != undefined && this.removeLastDuplicated
        ? this.doRemovingLastDuplicated(value)
        : this.bufferedItems;

    // push away expried messages
    items = items.filter(i => i.timestamp > now - i.minDuration);

    //return if no value to save
    if (value == undefined) {
      this.bufferedItems = items;
      return;
    }

    // push the current message with a timestamp
    const item: BufferedItem<T> = {
      value,
      minDuration,
      timestamp: Date.now()
    };

    // ask the last old value if any to move away later when the min duration is completed
    if (items.length > 0) {
      const last = items[0];
      const durationLeft = item.minDuration - (now - last.timestamp);
      setTimeout(
        () => {
          this.remove(last.value);
        },
        durationLeft < 0 ? 0 : durationLeft
      );
    }

    this.bufferedItems = [item, ...items];
  }

  private doRemovingLastDuplicated(value: T) {
    if (
      this.bufferedItems.length > 0 &&
      deepEqual(this.bufferedItems[0].value, value)
    ) {
      return this.bufferedItems.slice(1);
    } else {
      return this.bufferedItems;
    }
  }

  private remove(value: T): void {
    // console.info("remove :", value);
    const index = this.bufferedItems.findIndex(s =>
      deepEqual(s.value, value)
    );
    if (index >= 0) {
      this.bufferedItems = [
        ...this.bufferedItems.slice(0, index),
        ...this.bufferedItems.slice(index + 1)
      ];
    }
  }
}

function deepEqual(x: any, y: any) {
  if (x === y) {
    return true;
  } else if (
    typeof x === "object" &&
    x !== null &&
    typeof y === "object" &&
    y !== null
  ) {
    if (Object.keys(x).length !== Object.keys(y).length) return false;

    for (const prop in x) {
      if (y.hasOwnProperty(prop)) {
        if (!deepEqual(x[prop], y[prop])) return false;
      } else return false;
    }

    return true;
  } else return false;
}
