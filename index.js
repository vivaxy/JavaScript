/**
 * @since 20180503 11:40
 * @author vivaxy
 */

const tokenizer = require('./lib/tokenizer.js');
const parser = require('./lib/parser.js');
const execute = require('./lib/execute.js');

function compiler(input, scope) {
  const tokens = tokenizer(input);
  const ast = parser(tokens);
  return execute(ast, scope);
}

module.exports = compiler;
