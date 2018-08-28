/**
 * @since 20180828 13:34
 * @author vivaxy
 */

const path = require('path');
const Benchmark = require('benchmark');
const fse = require('fs-extra');
const glob = require('fast-glob');

const parse = require('../lib/parse.js');
const { parse: babelParse } = require('@babel/parser');
const { parse: acornParse } = require('acorn');

const suite = new Benchmark.Suite();

(async () => {
  const dirs = ['execute', 'parse', 'serialize'];
  const baseDir = path.join(__dirname, '..', 'lib', '__tests__', 'fixtures');
  const getTestCaseTasks = dirs.map((dir) => {
    const task = async () => {
      const testCases = await glob('*', {
        cwd: path.join(baseDir, dir),
        onlyDirectories: true,
      });
      return testCases.map((testCase) => {
        return path.join(dir, testCase);
      });
    };
    return task();
  });
  const testCaseNames = (await Promise.all(getTestCaseTasks)).reduce(
    (arr, list) => {
      return arr.concat(list);
    },
    []
  );
  const getTestCaseInputTasks = testCaseNames.map((testCaseName) => {
    const task = async () => {
      return fse.readFile(path.join(baseDir, testCaseName, 'input.js'), 'utf8');
    };
    return task();
  });
  const testCaseInputs = await Promise.all(getTestCaseInputTasks);

  let message = '';

  suite
    .add('@vivaxy/javascript#parse', function() {
      testCaseInputs.forEach((input) => {
        parse(input);
      });
    })
    .add('@babel/parser#parse', function() {
      testCaseInputs.forEach((input) => {
        babelParse(input);
      });
    })
    .add('acorn#parse', function() {
      testCaseInputs.forEach((input) => {
        acornParse(input);
      });
    })
    .on('cycle', function(event) {
      message += String(event.target) + '\n';
    })
    .on('complete', async function() {
      message += 'Fastest is ' + this.filter('fastest').map('name');

      const readmePath = path.join(__dirname, '..', 'README.md');
      const splitString = '\n## ';
      const readme = await fse.readFile(readmePath, 'utf8');
      const readmes = readme.split(splitString).map((readmeSection) => {
        if (readmeSection.startsWith('Benchmark')) {
          return 'Benchmark\n\n' + message + '\n';
        }
        return readmeSection;
      });
      await fse.writeFile(readmePath, readmes.join(splitString));
    })
    .run();
})();
