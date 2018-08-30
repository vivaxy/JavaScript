/**
 * @since 20180827 11:06
 * @author vivaxy
 */

const path = require('path');
const test = require('ava');
const fse = require('fs-extra');

const parse = require('../parse.js');
const execute = require('../execute.js');
const runFixtures = require('./helpers/run-fixtures.js');

test('execute', async (t) => {
  const runTest = async (testCaseBase, testCaseName) => {
    const input = await fse.readFile(
      path.join(testCaseBase, 'input.js'),
      'utf8'
    );
    const output = require(path.join(testCaseBase, 'output.js'));
    const scopeFile = path.join(testCaseBase, 'scope.js');
    let ans;
    try {
      if (await fse.exists(scopeFile)) {
        const scope = require(scopeFile);
        const ast = parse(input);
        ans = execute(ast, scope);
      } else {
        const ast = parse(input);
        ans = execute(ast);
      }
    } catch (e) {
      t.fail('Test case error: ' + testCaseName + '\n error: ' + e.stack);
    }
    t.deepEqual(ans, output, 'Test case error: ' + testCaseName);
  };

  const onlyCaseName = '';

  await runFixtures(
    path.join(__dirname, 'fixtures', 'execute'),
    runTest,
    onlyCaseName
  );
});
