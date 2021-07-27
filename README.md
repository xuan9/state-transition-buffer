# state-transition-buffer
Does state change too quickly? With stage-transition-buffer, the minimum duration of any state can be secured.

# usage example
```javascript
let connectionState = new StateBuffer({defaultMinDuration:1000, isRemoveLastDuplicated:true});
connectionState.push("connecting...",500);
connectionState.push("connected",2000);
connectionState.push();
connectionState.push("connection lost");
connectionState.push("re-connecting...",500);
connectionState.push("connection failed");
// get the current states in the buffer
let currentConnectionStates[] = connectionState.get();
// the current internal buffered items which have the time details, it returns a new array if there was any new push, so it can be used for listening.
let timeBufferedItems[] = connectionState.timeBufferedItems;
```