/**
 * @since 20180830 17:42
 * @author vivaxy
 */

const path = require('path');
const fse = require('fs-extra');

module.exports = async (baseDir, runTest, onlyCaseName, todoCaseNames = []) => {
  let testCases = await fse.readdir(baseDir);

  testCases = testCases.filter((x) => {
    if (todoCaseNames.includes(x)) {
      console.warn('TODO: ' + x);
      return false;
    }
    return true;
  });

  if (onlyCaseName) {
    console.warn('Only test case: ' + onlyCaseName);
    testCases = testCases.filter((x) => {
      return x === onlyCaseName;
    });
  }

  const tested = [];
  for (let i = 0; i < testCases.length; i++) {
    const testCaseBaseDir = path.join(baseDir, testCases[i]);
    let inputUniqueKey = null;
    inputUniqueKey = await runTest(testCaseBaseDir, testCases[i]);
    if (typeof inputUniqueKey !== 'string') {
      throw new Error('Missing returning inputUniqueKey');
    }
    if (inputUniqueKey && tested.includes(inputUniqueKey)) {
      throw new Error(
        `Already tested: ${testCases[i]} same to ${
          testCases[tested.indexOf(inputUniqueKey)]
        }`
      );
    }
    tested.push(inputUniqueKey);
  }
};
