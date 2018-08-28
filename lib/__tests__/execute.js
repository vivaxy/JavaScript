/**
 * @since 20180827 11:06
 * @author vivaxy
 */

const path = require('path');
const test = require('ava');
const fse = require('fs-extra');
const glob = require('fast-glob');

const parse = require('../parse.js');
const execute = require('../execute.js');

test('execute', async (t) => {
  const baseDir = path.join(__dirname, 'fixtures', 'execute');
  const testCases = (await glob('*', {
    cwd: baseDir,
    onlyDirectories: true,
  })).filter((x) => {
    return true;
    return x === 'sequence-expression-000';
  });

  const tested = [];
  for (let i = 0; i < testCases.length; i++) {
    const testRootDir = path.join(baseDir, testCases[i]);
    const input = await fse.readFile(
      path.join(testRootDir, 'input.js'),
      'utf8'
    );
    const output = require(path.join(testRootDir, 'output.js'));

    t.is(
      tested.indexOf(input),
      -1,
      'Already tested: ' +
        testCases[i] +
        ' same to ' +
        testCases[tested.indexOf(input)]
    );
    const scopeFile = path.join(testRootDir, 'scope.js');
    let ans = null;

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
      t.fail('Test case error: ' + testCases[i] + '\n error: ' + e.stack);
    }
    t.deepEqual(ans, output, 'Test case error: ' + testCases[i]);

    tested.push(input);
  }
});
