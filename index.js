/**
 * @since 20180503 11:40
 * @author vivaxy
 */

const parse = require('./lib/parse.js');
const execute = require('./lib/execute.js');

function compiler(input, scope) {
  const ast = parse(input);
  return execute(ast, scope);
}

module.exports = compiler;
