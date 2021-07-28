import { StateBuffer } from "../src/index";
import "jest-extended";

test("test StateBuffer with default options", () => {
  //mock Date.now() function, which is used in the code to check if state is expired.
  let now = 1530518207007;
  global.Date.now = jest.fn(() => now);
  expect(Date.now()).toBe(now);

  //make sure the timer mock works, the default "modern" doesn't work for me
  jest.useFakeTimers("legacy");
  setTimeout(() => {}, 0);
  expect(setTimeout).toHaveBeenCalledTimes(1);
  jest.clearAllMocks();

  let loadingState = new StateBuffer({
    defaultMinDuration: 1000,
    removeLastDuplicated: true
  });

  // test first push
  loadingState.push("loading", 1000);
  expect(loadingState.size()).toEqual(1);
  expect(loadingState.first).toEqual("loading");
  expect(loadingState.last).toEqual("loading");
  expect(setTimeout).toHaveBeenCalledTimes(0);

  // the state stays if there is no new push.
  expect(loadingState.size()).toEqual(1);
  expect(loadingState.first).toEqual("loading");
  expect(loadingState.last).toEqual("loading");
  expect(setTimeout).toHaveBeenCalledTimes(0);

  // push the second value after minDuration passed:
  //     the stage will be transite immediately
  now += 2000;
  loadingState.push("failed");
  expect(setTimeout).toHaveBeenCalledTimes(0);
  expect(loadingState.size()).toEqual(1);
  expect(loadingState.first).toEqual("failed");
  expect(loadingState.last).toEqual("failed");
  // push the 3rd value after 0.5s which < minDuration 1s
  now += 500;
  loadingState.push("loading", 500);
  expect(loadingState.size()).toEqual(2);
  expect(loadingState.first).toEqual("loading");
  expect(loadingState.last).toEqual("failed");
  expect(setTimeout).toHaveBeenCalledTimes(1);
  expect(setTimeout).toHaveBeenLastCalledWith(
    expect.any(Function),
    expect.toBeWithin(400, 600)
  );

  // test empty push after the old expired hasn't expired
  now += 100;
  loadingState.push(); 
  expect(loadingState.size()).toEqual(2);
  // test empty push after the old expired has expired
  now += 500;
  loadingState.push(); 
  expect(loadingState.size()).toEqual(0);
  expect(loadingState.first).toEqual(undefined);
  expect(loadingState.last).toEqual(undefined);

});
