/**
 * @since 20180824 12:19
 * @author vivaxy
 */

const { astTypes } = require('../types/ast-types.js');

const traverseTypes = {
  [astTypes.PROGRAM](ast, visitor) {
    ast.body.forEach((child) => {
      traverse(child, visitor);
    });
  },
  [astTypes.EXPRESSION_STATEMENT](ast, visitor) {
    traverse(ast.expression, visitor);
  },
  [astTypes.LITERAL](ast, visitor) {},
  [astTypes.BINARY_EXPRESSION](ast, visitor) {
    traverse(ast.left, visitor);
    traverse(ast.right, visitor);
  },
  [astTypes.UNARY_EXPRESSION](ast, visitor) {
    traverse(ast.argument, visitor);
  },
  [astTypes.LOGICAL_EXPRESSION](ast, visitor) {
    traverse(ast.left, visitor);
    traverse(ast.right, visitor);
  },
  [astTypes.IDENTIFIER](ast, visitor) {},
  [astTypes.SEQUENCE_EXPRESSION](ast, visitor) {
    ast.expressions.forEach((child) => {
      traverse(child, visitor);
    });
  },
  [astTypes.CONDITIONAL_EXPRESSION](ast, visitor) {
    traverse(ast.test, visitor);
    traverse(ast.consequent, visitor);
    traverse(ast.alternate, visitor);
  },
  [astTypes.MEMBER_EXPRESSION](ast, visitor) {
    traverse(ast.object, visitor);
    traverse(ast.property, visitor);
  },
  [astTypes.UPDATE_EXPRESSION](ast, visitor) {
    traverse(ast.argument, visitor);
  },
};

function traverse(ast, visitor) {
  visitor(ast);
  if (!traverseTypes[ast.type]) {
    throw new Error('Unexpected ast.type: ' + ast.type);
  }
  return traverseTypes[ast.type](ast, visitor);
}

module.exports = traverse;
