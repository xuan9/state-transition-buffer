import StateBuffer from "../src/index";
import "jest-extended";

test("test StateBuffer with default options", () => {
  //mock Date.now() function, which is used in the code to check if state is expired.
  let now = 1530518207007;
  global.Date.now = jest.fn(()=>now);
  expect(Date.now() ).toBe(now);

  //make sure the timer mock works, the default "modern" doesn't work for me
  jest.useFakeTimers("legacy");
  setTimeout(() => {}, 0);
  expect(setTimeout).toHaveBeenCalledTimes(1);
  jest.clearAllMocks();

  let loadingState = new StateBuffer();
  // test first push
  loadingState.push("loading", 1000);
  expect(loadingState.size()).toEqual(1);
  expect(loadingState.get()[0]).toEqual("loading");
  expect(setTimeout).toHaveBeenCalledTimes(0);

  // the state stays if there is no new push, after 2s which > minDuration.
  now += 2000;
  expect(loadingState.size()).toEqual(1);
  expect(loadingState.get()[0]).toEqual("loading");
  expect(setTimeout).toHaveBeenCalledTimes(0);

  // push the second value after minDuration passed: 
  //     the stage will be transite immediately
  loadingState.push("failed", 1000);
  expect(setTimeout).toHaveBeenCalledTimes(0);
  expect(loadingState.size()).toEqual(1);

  now += 500;
  expect(loadingState.size()).toEqual(1);
  expect(loadingState.get()[0]).toEqual("failed");

  // push the 3rd value before 0.5s which < minDuration 
  loadingState.push("loading", 1000);
  expect(loadingState.size()).toEqual(2);
  expect(loadingState.get()[0]).toEqual("loading");
  expect(loadingState.get()[1]).toEqual("failed");
  expect(setTimeout).toHaveBeenCalledTimes(1);
  expect(setTimeout).toHaveBeenLastCalledWith(
    expect.any(Function),
    expect.toBeWithin(400, 600)
  );

   // test empty push
  now += 2000;
  expect(loadingState.get()[0]).toEqual("loading");
  loadingState.push(); //push nothing after 2s > minDuration, it pushes away the existing values 
  expect(loadingState.size()).toEqual(0);
});
