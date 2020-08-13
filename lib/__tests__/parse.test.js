/**
 * @since 20180827 10:58
 * @author vivaxy
 */

const path = require('path');
const fse = require('fs-extra');

const parse = require('../parse.js');
const runFixtures = require('./helpers/run-fixtures.js');

test('parse', async function () {
  const runTest = async (testCaseBase, testCaseName) => {
    const actualFile = path.join(testCaseBase, 'actual.json');
    const input = await fse.readFile(
      path.join(testCaseBase, 'input.js'),
      'utf8'
    );
    const output = require(path.join(testCaseBase, 'output.json'));
    let ans = null;

    await fse.remove(actualFile);

    ans = parse(input);
    if (JSON.stringify(ans) !== JSON.stringify(output)) {
      await fse.writeFile(actualFile, JSON.stringify(ans, null, 2));
    }
    expect(JSON.parse(JSON.stringify(ans))).toStrictEqual(output, testCaseName);
    return input;
  };

  const onlyCaseName = '';
  const todoCaseNames = [];

  await runFixtures(
    path.join(__dirname, 'fixtures', 'parse'),
    runTest,
    onlyCaseName,
    todoCaseNames
  );
});
