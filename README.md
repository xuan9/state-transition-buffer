# state-transition-buffer
Does state change too quickly? With stage-transition-buffer, the minimum duration of any state can be secured.

# usage example
```javascript
import { StateBuffer } from 'state-transition-buffer';
let connectionState = new StateBuffer({
  defaultMinDuration: 1000,
  removeLastDuplicated: true
});
connectionState.push("connecting...", 500); //at least 0.5s
connectionState.push("connected", 2000); // at least 2s
connectionState.push();//empty push
connectionState.push("connection lost"); //use the default 1s 
connectionState.push("re-connecting...", 500); 
connectionState.push("connection failed");
// get the current states in the buffer
let currentConnectionStates = connectionState.get();
// the current internal buffered items which have the time details, it returns a new array if there was any new push, so it can be used for listening.
let bufferedItems = connectionState.bufferedItems;
```