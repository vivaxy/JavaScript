/**
 * @since 20180731 11:12
 * @author vivaxy
 */

const { astTypes } = require('../types/ast-types.js');

const serializeTypes = {
  [astTypes.PROGRAM](ast) {
    return ast.body
      .map((_ast) => {
        return this[astTypes.EXPRESSION_STATEMENT](_ast);
      })
      .join(';\n');
  },
  [astTypes.EXPRESSION_STATEMENT](ast) {
    return this[ast.expression.type](ast.expression);
  },
  [astTypes.LITERAL](ast) {
    if (typeof ast.value === 'string') {
      return "'" + ast.value + "'";
    } else if (typeof ast.value === 'number') {
      return ast.value;
    }
    throw new Error('Unexpected typeof ast.value: ' + typeof ast.value);
  },
  [astTypes.IDENTIFIER](ast) {
    return ast.name;
  },
  [astTypes.BINARY_EXPRESSION](ast) {
    return (
      '(' +
      this[ast.left.type](ast.left) +
      ' ' +
      ast.operator +
      ' ' +
      this[ast.right.type](ast.right) +
      ')'
    );
  },
  [astTypes.UNARY_EXPRESSION](ast) {
    if (
      ast.operator === '-' ||
      ast.operator === '+' ||
      ast.operator === '!' ||
      ast.operator === '~'
    ) {
      return ast.operator + this[ast.argument.type](ast.argument);
    }
    if (ast.operator === 'void') {
      return ast.operator + ' ' + this[ast.argument.type](ast.argument);
    }
    throw new Error('Unexpected ast.type: ' + ast.type);
  },
  [astTypes.LOGICAL_EXPRESSION](ast) {
    return (
      '(' +
      this[ast.left.type](ast.left) +
      ' ' +
      ast.operator +
      ' ' +
      this[ast.right.type](ast.right) +
      ')'
    );
  },
  [astTypes.SEQUENCE_EXPRESSION](ast) {
    return ast.expressions
      .map((_ast) => {
        return this[astTypes.EXPRESSION_STATEMENT](_ast);
      })
      .join(', ');
  },
  [astTypes.CONDITIONAL_EXPRESSION](ast) {
    return (
      '(' +
      this[ast.test.type](ast.test) +
      ' ? ' +
      this[ast.consequent.type](ast.consequent) +
      ' : ' +
      this[ast.alternate.type](ast.alternate) +
      ')'
    );
  },
  [astTypes.MEMBER_EXPRESSION](ast) {
    return this[ast.object.type](ast.object) + '.' + ast.property.name;
  },
};

module.exports = function serialize(ast) {
  return serializeTypes[ast.type](ast);
};
