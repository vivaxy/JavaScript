/**
 * @since 20180824 12:19
 * @author vivaxy
 */

const { astTypes } = require('../types/ast-types.js');

module.exports = function traverse(ast, visitor) {
  switch (ast.type) {
    case astTypes.PROGRAM:
      visitor(ast);
      ast.body.forEach((child) => {
        traverse(child, visitor);
      });
      break;
    case astTypes.IDENTIFIER:
    case astTypes.LITERAL:
      visitor(ast);
      break;
    default:
      throw new Error('Unexpected ast type: ' + ast.type);
  }
};
