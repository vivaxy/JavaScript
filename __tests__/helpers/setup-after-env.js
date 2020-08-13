/**
 * @since 2020-08-13 11:04
 * @author vivaxy
 */
expect.extend({
  toStrictEqual(received, expected, testcaseName) {
    if (JSON.stringify(received) === JSON.stringify(expected)) {
      return {
        message: () => `${testcaseName} passed`,
        pass: true
      };
    } else {
      return {
        message: () => `${testcaseName} failed`,
        pass: false
      };
    }
  }
});
