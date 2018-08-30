/**
 * @since 20180503 11:42
 * @author vivaxy
 */

const path = require('path');
const test = require('ava');
const fse = require('fs-extra');

const runFixtures = require('./helpers/run-fixtures.js');
const parse = require('../parse.js');
const serialize = require('../serialize.js');

test('serialize', async (t) => {
  const runTest = async (testCaseBase, testCaseName) => {
    const input = await fse.readFile(
      path.join(testCaseBase, 'input.js'),
      'utf8'
    );
    const output = await fse.readFile(
      path.join(testCaseBase, 'output.js'),
      'utf8'
    );
    let ans = null;
    try {
      const ast = parse(input);
      ans = serialize(ast);
    } catch (e) {
      t.fail('Test case error: ' + testCaseName + '\n error: ' + e.stack);
      throw new Error(e);
    }

    t.deepEqual(ans, output, 'Test case error: ' + testCaseName);
    return input;
  };

  const onlyCaseName = '';

  await runFixtures(
    path.join(__dirname, 'fixtures', 'serialize'),
    runTest,
    onlyCaseName
  );
});
