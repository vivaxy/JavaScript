/**
 * @since 20180503 11:42
 * @author vivaxy
 */

const path = require('path');
const test = require('ava');
const fse = require('fs-extra');
const globP = require('glob-promise');

const tokenizer = require('../lib/tokenizer.js');
const parser = require('../lib/parser.js');
const execute = require('../lib/execute.js');
const stringify = require('../lib/stringify.js');

test('tokenizer', async(t) => {
  const baseDir = path.join(__dirname, 'fixtures', 'tokenizer');
  const testCases = await globP('*', { cwd: baseDir });

  const tested = [];
  for (let i = 0; i < testCases.length; i++) {

    const testRootDir = path.join(baseDir, testCases[i]);
    const input = await fse.readFile(path.join(testRootDir, 'index.js'), 'utf8');
    const output = await fse.readJson(path.join(testRootDir, 'index.json'));

    t.is(tested.indexOf(input), -1, 'Already tested: ' + testCases[i] + ' same to ' + testCases[tested.indexOf(input)]);
    t.deepEqual(tokenizer(input), output, 'Test case error: ' + testCases[i]);
    tested.push(input);
  }
});

test('parser', async(t) => {
  const baseDir = path.join(__dirname, 'fixtures', 'parser');
  const testCases = await globP('*', { cwd: baseDir });

  const tested = [];
  for (let i = 0; i < testCases.length; i++) {
    const testRootDir = path.join(baseDir, testCases[i]);
    const input = await fse.readFile(path.join(testRootDir, 'index.js'), 'utf8');
    const output = require(path.join(testRootDir, 'index.json'));

    t.is(tested.indexOf(input), -1, 'Already tested: ' + testCases[i] + ' same to ' + testCases[tested.indexOf(input)]);
    if (JSON.stringify(parser(tokenizer(input))) !== JSON.stringify(output)) {
      await fse.writeFile(path.join(testRootDir, 'actual.json'), JSON.stringify(parser(tokenizer(input)), null, 2));
      t.fail('Test case error: ' + testCases[i]);
    }
    tested.push(input);
  }
});

test('execute', async(t) => {
  const baseDir = path.join(__dirname, 'fixtures', 'execute');
  const testCases = await globP('*', { cwd: baseDir });

  const tested = [];
  for (let i = 0; i < testCases.length; i++) {
    const testRootDir = path.join(baseDir, testCases[i]);
    const input = await fse.readFile(path.join(testRootDir, 'index.js'), 'utf8');
    const output = require(path.join(testRootDir, 'output.js'));

    t.is(tested.indexOf(input), -1, 'Already tested: ' + testCases[i] + ' same to ' + testCases[tested.indexOf(input)]);
    const scopeFile = path.join(testRootDir, 'scope.js');
    if (await fse.exists(scopeFile)) {
      const scope = require(scopeFile);
      t.deepEqual(execute(parser(tokenizer(input)), scope), output, 'Test case error: ' + testCases[i]);
    } else {
      t.deepEqual(execute(parser(tokenizer(input))), output, 'Test case error: ' + testCases[i]);
    }
    tested.push(input);
  }
});

test('stringify', async(t) => {
  const baseDir = path.join(__dirname, 'fixtures', 'stringify');
  const testCases = await globP('*', { cwd: baseDir });

  const tested = [];
  for (let i = 0; i < testCases.length; i++) {
    const testRootDir = path.join(baseDir, testCases[i]);
    const input = await fse.readFile(path.join(testRootDir, 'index.js'), 'utf8');
    const output = await fse.readFile(path.join(testRootDir, 'output.js'), 'utf8');

    t.is(tested.indexOf(input), -1, 'Already tested: ' + testCases[i] + ' same to ' + testCases[tested.indexOf(input)]);
    t.deepEqual(stringify(parser(tokenizer(input))), output, 'Test case error: ' + testCases[i]);
    tested.push(input);
  }
});
