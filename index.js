/**
 * @since 20180503 11:40
 * @author vivaxy
 */

const tokenize = require('./lib/tokenize.js');
const parse = require('./lib/parse.js');
const execute = require('./lib/execute.js');

function compiler(input, scope) {
  const tokens = tokenize(input);
  const ast = parse(tokens);
  return execute(ast, scope);
}

module.exports = compiler;
