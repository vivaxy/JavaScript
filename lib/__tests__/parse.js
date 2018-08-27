/**
 * @since 20180827 10:58
 * @author vivaxy
 */

const path = require('path');
const test = require('ava');
const fse = require('fs-extra');
const glob = require('fast-glob');

const parse = require('../parse.js');

test('parse', async (t) => {
  const baseDir = path.join(__dirname, 'fixtures', 'parse');
  const testCases = (await glob('*', {
    cwd: baseDir,
    onlyDirectories: true,
  })).filter((x) => {
    return true;
    return x === 'number-000';
  });

  const tested = [];
  for (let i = 0; i < testCases.length; i++) {
    const testRootDir = path.join(baseDir, testCases[i]);
    const input = await fse.readFile(
      path.join(testRootDir, 'input.js'),
      'utf8'
    );
    const output = require(path.join(testRootDir, 'output.json'));

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
      ans = parse(input);
      if (JSON.stringify(ans) !== JSON.stringify(output)) {
        await fse.writeFile(
          path.join(testRootDir, 'actual.json'),
          JSON.stringify(ans, null, 2)
        );
        t.fail('Test case error: ' + testCases[i]);
      }
    } catch (e) {
      t.fail('Test case error: ' + testCases[i] + '\n error: ' + e.stack);
      throw new Error(e);
    }

    tested.push(input);
  }
});
