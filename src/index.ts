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
export interface TimeBufferedItem<T> {
  value: T;
  minDuration: number;
  timestamp: number;
}

/**
 * A generic object to buffer the value changes for a minimum duration.
 *  Example usage:
 *  ```javascript
 *  let connectionState = new StateBuffer({defaultMinDuration:1000, isRemoveLastDuplicated:true});
 *  connectionState.push("connecting...",500);
 *  connectionState.push("connected",2000);
 *  connectionState.push();
 *  connectionState.push("connection lost");
 *  connectionState.push("re-connecting...",500);
 *  connectionState.push("connection failed");
 *  // get the current values in the buffer
 *  let currentConnectionStates[] = connectionState.get();
 *  // the current internal buffered items which have the time details, it returns a new array if there was any new push, so it can be used for listening.
 *  let timeBufferedItems[] = connectionState.timeBufferedItems;
 * ```
 */
export default class StateBuffer<T> {
  public timeBufferedItems = new Array<TimeBufferedItem<T>>();
  public isRemoveLastDuplicated?: boolean = false;
  public defaultMinDuration?: number;

  /**
   * Constuct the value buffer with two optional options:
   * @param defaultMinDuration optinal,used if no minDuration parameter given on push
   * @param isRemoveLastDuplicated optinal, if true, will try to remove the last value in the buffer immediately if it DEEP equals with the new value
   */
  public StateBuffer(options?: {
    defaultMinDuration?: number;
    isRemoveLastDuplicated?: boolean;
  }) {
    this.defaultMinDuration = options?.defaultMinDuration;
    this.isRemoveLastDuplicated = options?.isRemoveLastDuplicated;
  }

  get(): T[] {
    return this.timeBufferedItems.map(item => item.value);
  }

  public size() {
    return this.timeBufferedItems.length;
  }

  public push(value?: T, minDuration?: number) {
    const now = Date.now();
    minDuration = minDuration ?? this.defaultMinDuration ?? 0;

    // try remove the last duplicated message if the option enabled
    let items =
      value != undefined && this.isRemoveLastDuplicated
        ? this.removeLastDuplicated(value)
        : this.timeBufferedItems;

    // push away expried messages
    items = items.filter(i => i.timestamp > now - i.minDuration);

    //return if no value to save
    if (value == undefined) {
      this.timeBufferedItems = items;
      return;
    }

    // push the current message with a timestamp
    const item: TimeBufferedItem<T> = {
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

    this.timeBufferedItems = [item, ...items];
  }

  private removeLastDuplicated(value: T) {
    if (
      this.timeBufferedItems.length > 0 &&
      deepEqual(this.timeBufferedItems[0].value, value)
    ) {
      return this.timeBufferedItems.slice(1);
    } else {
      return this.timeBufferedItems;
    }
  }

  private remove(value: T): void {
    console.info("remove :", value);
    const index = this.timeBufferedItems.findIndex(s =>
      deepEqual(s.value, value)
    );
    if (index >= 0) {
      this.timeBufferedItems = [
        ...this.timeBufferedItems.slice(0, index),
        ...this.timeBufferedItems.slice(index + 1)
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
