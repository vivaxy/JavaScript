/**
 * @since 20180827 10:58
 * @author vivaxy
 */

const path = require('path');
const test = require('ava');
const fse = require('fs-extra');

const parse = require('../parse.js');
const runFixtures = require('./helpers/run-fixtures.js');

test('parse', async (t) => {
  const runTest = async (testCaseBase, testCaseName) => {
    const actualFile = path.join(testCaseBase, 'actual.json');
    const input = await fse.readFile(
      path.join(testCaseBase, 'input.js'),
      'utf8'
    );
    const output = require(path.join(testCaseBase, 'output.json'));
    let ans = null;

    await fse.remove(actualFile);

    try {
      ans = parse(input);
      t.deepEqual(
        JSON.parse(JSON.stringify(ans)),
        output,
        'Test case error: ' + testCaseName
      );
      if (JSON.stringify(ans) !== JSON.stringify(output)) {
        await fse.writeFile(actualFile, JSON.stringify(ans, null, 2));
      }
    } catch (e) {
      t.fail('Test case error: ' + testCaseName + '\n error: ' + e.stack);
    }
    return input;
  };

  const onlyCaseName = 'call-expression-000';
  const todoCaseNames = [];

  await runFixtures(
    path.join(__dirname, 'fixtures', 'parse'),
    runTest,
    onlyCaseName,
    todoCaseNames
  );
});
