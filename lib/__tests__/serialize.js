/**
 * @since 20180503 11:42
 * @author vivaxy
 */

const path = require('path');
const test = require('ava');
const fse = require('fs-extra');
const glob = require('fast-glob');

const parse = require('../parse.js');
const serialize = require('../serialize.js');

test('serialize', async (t) => {
  const baseDir = path.join(__dirname, 'fixtures', 'serialize');
  const testCases = (await glob('*', {
    cwd: baseDir,
    onlyDirectories: true,
  })).filter((x) => {
    return true;
    return x === 'binary-expression-precedences-001';
  });

  const tested = [];
  for (let i = 0; i < testCases.length; i++) {
    const testRootDir = path.join(baseDir, testCases[i]);
    const input = await fse.readFile(
      path.join(testRootDir, 'input.js'),
      'utf8'
    );
    const output = await fse.readFile(
      path.join(testRootDir, 'output.js'),
      'utf8'
    );

    t.is(
      tested.indexOf(input),
      -1,
      'Already tested: ' +
        testCases[i] +
        ' same to ' +
        testCases[tested.indexOf(input)]
    );

    let ans = null;
    try {
      const ast = parse(input);
      ans = serialize(ast);
    } catch (e) {
      t.fail('Test case error: ' + testCases[i] + '\n error: ' + e.stack);
      throw new Error(e);
    }

    t.deepEqual(ans, output, 'Test case error: ' + testCases[i]);
    tested.push(input);
  }
});
