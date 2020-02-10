/**
 * @since 20180503 11:42
 * @author vivaxy
 */

const path = require('path');
const test = require('ava');
const fse = require('fs-extra');

const runFixtures = require('./helpers/run-fixtures.js');
const serialize = require('../serialize.js');

async function readFile(filename) {
  return await fse.readFile(filename, 'utf8');
}

test('serialize', async (t) => {
  const runTest = async (testCaseBase, testCaseName) => {
    const input = require(path.join(testCaseBase, 'input.json'));
    const expected = await readFile(path.join(testCaseBase, 'output.js'));
    const actualPath = path.join(testCaseBase, 'actual.js');
    const actual = serialize(input);
    if (actual !== expected) {
      await fse.writeFile(actualPath, actual);
    } else {
      await fse.remove(actualPath);
    }
    t.deepEqual(actual, expected, 'Test case error: ' + testCaseName);
    return JSON.stringify(input);
  };

  const onlyCaseName = '';
  const todoTestCaseNames = [];

  await runFixtures(
    path.join(__dirname, 'fixtures', 'serialize'),
    runTest,
    onlyCaseName,
    todoTestCaseNames
  );
});
