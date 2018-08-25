/**
 * @since 20180503 11:42
 * @author vivaxy
 */

const path = require('path');
const test = require('ava');
const fse = require('fs-extra');
const glob = require('fast-glob');

const parse = require('../lib/parse.js');
const execute = require('../lib/execute.js');
const stringify = require('../lib/stringify.js');

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
      path.join(testRootDir, 'index.js'),
      'utf8'
    );
    const output = require(path.join(testRootDir, 'index.json'));

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
    } catch (e) {
      t.fail('Test case error: ' + testCases[i] + '\n error: ' + e.stack);
      throw new Error(e);
    }
    if (JSON.stringify(parse(input)) !== JSON.stringify(output)) {
      await fse.writeFile(
        path.join(testRootDir, 'actual.json'),
        JSON.stringify(parse(input), null, 2)
      );
      t.fail('Test case error: ' + testCases[i]);
    }
    tested.push(input);
  }
});

test('execute', async (t) => {
  const baseDir = path.join(__dirname, 'fixtures', 'execute');
  const testCases = (await glob('*', {
    cwd: baseDir,
    onlyDirectories: true,
  })).filter((x) => {
    return true;
    return x === '044';
  });

  const tested = [];
  for (let i = 0; i < testCases.length; i++) {
    const testRootDir = path.join(baseDir, testCases[i]);
    const input = await fse.readFile(
      path.join(testRootDir, 'index.js'),
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

test('stringify', async (t) => {
  const baseDir = path.join(__dirname, 'fixtures', 'stringify');
  const testCases = await glob('*', { cwd: baseDir, onlyDirectories: true });

  const tested = [];
  for (let i = 0; i < testCases.length; i++) {
    const testRootDir = path.join(baseDir, testCases[i]);
    const input = await fse.readFile(
      path.join(testRootDir, 'index.js'),
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
      ans = stringify(parse(input));
    } catch (e) {
      t.fail('Test case error: ' + testCases[i] + '\n error: ' + e.stack);
      throw new Error(e);
    }

    t.deepEqual(ans, output, 'Test case error: ' + testCases[i]);
    tested.push(input);
  }
});
