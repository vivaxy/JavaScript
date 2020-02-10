/**
 * @since 20180827 11:06
 * @author vivaxy
 */

const path = require('path');
const test = require('ava');
const fse = require('fs-extra');

const execute = require('../execute.js');
const runFixtures = require('./helpers/run-fixtures.js');

test('execute', async (t) => {
  const runTest = async (testCaseBase, testCaseName) => {
    const input = require(path.join(testCaseBase, 'input.json'));
    const expected = require(path.join(testCaseBase, 'output.js'));
    const scopeFile = path.join(testCaseBase, 'scope.js');

    let scope = {};
    if (await fse.exists(scopeFile)) {
      scope = require(scopeFile);
    }
    const actual = execute(input, scope);
    t.deepEqual(actual, expected, 'Test case error: ' + testCaseName);
    return JSON.stringify({ input, scope });
  };

  const onlyCaseName = '';
  const todoTestCaseNames = [];

  await runFixtures(
    path.join(__dirname, 'fixtures', 'execute'),
    runTest,
    onlyCaseName,
    todoTestCaseNames
  );
});
