# state-transition-buffer
Does state change too quickly? With stage-transition-buffer, the minimum duration of any state can be secured.

# usage example
```javascript
import { StateBuffer } from '../dist/src/index.js';

let connectionState = new StateBuffer({
  defaultMinDuration: 1000,
  removeLastDuplicated: true
});

let onchange = () => {
  let bufferedState = connectionState.last; //the one to show to user
  let realtimeState = connectionState.first;
  console.info(new Date(), bufferedState, realtimeState);
};
connectionState.registerChangeHandler(onchange);
connectionState.push("connecting...");
connectionState.push("connected", 2000);
connectionState.push();
connectionState.push("re-connecting...");
connectionState.push("failed to connect");
connectionState.push("re-connecting...");
connectionState.push("failed to connect");
connectionState.removeChangeHandler(onchange);
```