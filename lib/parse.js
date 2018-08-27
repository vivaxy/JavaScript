/**
 * @since 20180822 15:08
 * @author vivaxy
 */

const astFactory = require('../types/ast-types.js');
const astTypes = astFactory.astTypes;

module.exports = function parse(input) {
  const codesString = 'aftzAZ09_$"\'.\\ \n\r\t()[]+-*/%&|!^~<>=?:,;';
  let codes = {};
  codesString.split('').forEach((item) => {
    codes[item] = item.charCodeAt(0);
  });

  const program = new astFactory.Program([]);
  parseExpressionStatement(input, 0);
  return program;

  function parseExpressionStatement(input, depth) {
    let expressionStatement = null;
    let i = 0;
    let operator = null;
    let secondOperator = null;

    while (i < input.length) {
      let code = input.charCodeAt(i);

      if (
        isNumber(code) ||
        (code === codes['.'] && isNumber(input.charCodeAt(i + 1)))
      ) {
        let hasDot = code === codes['.'];
        const start = i;
        while (i < input.length) {
          i++;
          code = input.charCodeAt(i);
          if (!isNumber(code) && (hasDot || code !== codes['.'])) {
            break;
          }
          hasDot = hasDot || code === codes['.'];
        }
        updateNode(new astFactory.Literal(Number(input.slice(start, i))));
        continue;
      }

      if (matchToken('true')) {
        i += 4;
        updateNode(new astFactory.Literal(true));
        continue;
      }

      if (matchToken('false')) {
        i += 5;
        updateNode(new astFactory.Literal(false));
        continue;
      }

      if (matchToken('null')) {
        i += 4;
        updateNode(new astFactory.Literal(null));
        continue;
      }

      if (matchToken('undefined')) {
        i += 9;
        updateNode(new astFactory.Literal(undefined));
        continue;
      }

      if (isStringStart(code)) {
        const startCode = code;
        const startIndex = i;
        while (i < input.length) {
          i++;
          code = input.charCodeAt(i);
          if (code === startCode && input.charCodeAt(i - 1) !== codes['\\']) {
            break;
          }
        }

        updateNode(new astFactory.Literal(input.slice(startIndex + 1, i)));
        i++;
        continue;
      }

      if (matchToken('void')) {
        operator ? (secondOperator = 'void') : (operator = 'void');
        i += 4;
        continue;
      }

      if (isIdentifierStart(code)) {
        updateNode(new astFactory.Identifier(getIdentifier()));
        continue;
      }

      if (isWhiteSpace(code)) {
        i++;
        continue;
      }

      if (code === codes['(']) {
        let depth = 1;
        const startIndex = i;
        while (i < input.length) {
          i++;
          code = input.charCodeAt(i);
          if (code === codes['(']) {
            depth++;
            continue;
          }
          if (code === codes[')']) {
            depth--;
            if (depth === 0) {
              break;
            }
          }
        }

        updateNode(
          parseExpressionStatement(input.slice(startIndex + 1, i), depth + 1)
            .expression
        );
        i++;
        continue;
      }

      if (code === codes['.']) {
        i++;
        updateMemberExpression(
          new astFactory.Identifier(getIdentifier()),
          false
        );
        continue;
      }

      if (code === codes['[']) {
        let depth = 1;
        const startIndex = i;
        while (i < input.length) {
          i++;
          code = input.charCodeAt(i);
          if (code === codes['[']) {
            depth++;
            continue;
          }
          if (code === codes[']']) {
            depth--;
            if (depth === 0) {
              break;
            }
          }
        }

        updateMemberExpression(
          parseExpressionStatement(input.slice(startIndex + 1, i), depth + 1)
            .expression,
          true
        );
        i++;
        continue;
      }

      if (code === codes['!']) {
        if (matchToken('!==')) {
          operator = '!==';
          i += 3;
          continue;
        }
        if (matchToken('!=')) {
          operator = '!=';
          i += 2;
          continue;
        }
        operator ? (secondOperator = '!') : (operator = '!');
        i++;
        continue;
      }

      if (code === codes['+'] || code === codes['-']) {
        if (matchToken('++')) {
          operator ? (secondOperator = '++') : (operator = '++');
          i += 2;
          continue;
        }
        if (matchToken('--')) {
          operator ? (secondOperator = '--') : (operator = '--');
          i += 2;
          continue;
        }
        operator
          ? (secondOperator = String.fromCharCode(code))
          : (operator = String.fromCharCode(code));
        i++;
        continue;
      }

      if (code === codes['~']) {
        operator ? (secondOperator = '~') : (operator = '~');
        i++;
        continue;
      }

      if (code === codes['*']) {
        if (matchToken('**')) {
          operator = '**';
          i += 2;
          continue;
        }
        operator = '*';
        i++;
        continue;
      }

      if (code === codes['/']) {
        operator = '/';
        i++;
        continue;
      }

      if (code === codes['%']) {
        operator = '%';
        i++;
        continue;
      }

      if (code === codes['<']) {
        if (matchToken('<<')) {
          operator = '<<';
          i += 2;
          continue;
        }
        if (matchToken('<=')) {
          operator = '<=';
          i += 2;
          continue;
        }
        operator = '<';
        i++;
        continue;
      }

      if (code === codes['>']) {
        if (matchToken('>>>')) {
          operator = '>>>';
          i += 3;
          continue;
        }
        if (matchToken('>>')) {
          operator = '>>';
          i += 2;
          continue;
        }
        if (matchToken('>=')) {
          operator = '>=';
          i += 2;
          continue;
        }
        operator = '>';
        i++;
        continue;
      }

      if (code === codes['=']) {
        if (matchToken('===')) {
          operator = '===';
          i += 3;
          continue;
        }
        if (matchToken('==')) {
          operator = '==';
          i += 2;
          continue;
        }
      }

      if (code === codes['&']) {
        if (matchToken('&&')) {
          operator = '&&';
          i += 2;
          continue;
        }
        operator = '&';
        i++;
        continue;
      }

      if (code === codes['^']) {
        operator = '^';
        i++;
        continue;
      }

      if (code === codes['|']) {
        if (matchToken('||')) {
          operator = '||';
          i += 2;
          continue;
        }
        operator = '|';
        i++;
        continue;
      }

      if (code === codes['?']) {
        // find :
        const start = i;

        while (i < input.length) {
          i++;
          code = input.charCodeAt(i);
          if (code === codes[':']) {
            break;
          }
        }
        updateConditionalExpression(
          new astFactory.ConditionalExpression(
            expressionStatement.expression,
            parseExpressionStatement(
              input.slice(start + 1, i),
              depth + 1
            ).expression,
            parseExpressionStatement(input.slice(i + 1), depth + 1).expression
          )
        );
        i = input.length;
        break;
      }

      if (code === codes[',']) {
        i++;
        break;
      }

      if (code === codes[';']) {
        i++;
        continue;
      }

      throwError('Unexpected token: ' + String.fromCharCode(code));
    }

    if (depth === 0) {
      program.body.push(expressionStatement);
    }
    if (i < input.length) {
      program.body.push(parseExpressionStatement(input.slice(i), 0));
    }
    if (operator || secondOperator) {
      throwError('Error operator: ' + (operator || secondOperator));
    }
    return expressionStatement;

    function updateNode(node) {
      if (expressionStatement === null) {
        if (astFactory.isUnaryExpressionOperator(operator)) {
          expressionStatement = new astFactory.ExpressionStatement(
            new astFactory.UnaryExpression(operator, node)
          );
          return (operator = null);
        }
        return (expressionStatement = new astFactory.ExpressionStatement(node));
      }

      if (
        astFactory.isUpdateExpressionOperator(operator) &&
        node.type === astTypes.IDENTIFIER
      ) {
        expressionStatement.expression = new astFactory.UpdateExpression(
          operator,
          node,
          false
        );
        return (operator = null);
      }
      if (astFactory.isBinaryExpressionOperator(operator)) {
        node = updateSecondOperator(node);
        if (
          expressionStatement.expression.type === astTypes.LOGICAL_EXPRESSION
        ) {
          expressionStatement.expression.right = new astFactory.BinaryExpression(
            operator,
            expressionStatement.expression.right,
            node
          );
        } else {
          expressionStatement.expression = new astFactory.BinaryExpression(
            operator,
            expressionStatement.expression,
            node
          );
        }
        return (operator = null);
      }
      if (astFactory.isLogicalExpressionOperator(operator)) {
        if (
          operator === '&&' &&
          expressionStatement.expression.type === astTypes.LOGICAL_EXPRESSION &&
          expressionStatement.expression.operator === '||'
        ) {
          node = updateSecondOperator(node);
          // && precedent to ||
          expressionStatement.expression.right = new astFactory.LogicalExpression(
            operator,
            expressionStatement.expression.right,
            node
          );
          return (operator = null);
        }
        node = updateSecondOperator(node);
        expressionStatement.expression = new astFactory.LogicalExpression(
          operator,
          expressionStatement.expression,
          node
        );
        return (operator = null);
      }
      throwError('Unexpected operator: ' + operator);
    }

    function updateConditionalExpression(expression) {
      expressionStatement = expression;
    }

    function updateSecondOperator(node) {
      if (secondOperator) {
        if (astFactory.isUnaryExpressionOperator(secondOperator)) {
          node = new astFactory.UnaryExpression(secondOperator, node);
        } else if (astFactory.isUpdateExpressionOperator(secondOperator)) {
          node = new astFactory.UpdateExpression(secondOperator, node, true);
        } else {
          throwError('Unexpected operator: ' + secondOperator);
        }
        secondOperator = null;
      }
      return node;
    }

    function updateMemberExpression(expression, computed) {
      setMemberExpression(expressionStatement);

      function setMemberExpression(node) {
        switch (node.type) {
          case astTypes.EXPRESSION_STATEMENT:
            if (
              node.expression.type === astTypes.LITERAL ||
              node.expression.type === astTypes.IDENTIFIER ||
              node.expression.type === astTypes.MEMBER_EXPRESSION
            ) {
              node.expression = new astFactory.MemberExpression(
                node.expression,
                expression,
                computed
              );
            } else {
              setMemberExpression(node.expression);
            }
            break;
          case astTypes.BINARY_EXPRESSION:
            if (
              node.right.type === astTypes.LITERAL ||
              node.right.type === astTypes.IDENTIFIER ||
              node.right.type === astTypes.MEMBER_EXPRESSION
            ) {
              node.right = new astFactory.MemberExpression(
                node.right,
                expression,
                computed
              );
            } else {
              setMemberExpression(node.right);
            }
            break;
          default:
            throwError('Unexpected node type: ' + node.type);
        }
      }
    }

    function getIdentifier() {
      const start = i;
      let code;
      while (i < input.length) {
        i++;
        code = input.charCodeAt(i);
        if (isIdentifierEnd(code)) {
          break;
        }
      }
      return input.slice(start, i);
    }

    function matchToken(token) {
      for (let t = 0; t < token.length; t++) {
        if (token.charCodeAt(t) !== input.charCodeAt(i + t)) {
          return false;
        }
      }
      return true;
    }
  }

  function isIdentifierStart(code) {
    // a-z A-Z _ $
    return (
      (code >= codes.a && code <= codes.z) ||
      (code >= codes.A && code <= codes.Z) ||
      code === codes._ ||
      code === codes.$
    );
  }

  function isIdentifierEnd(code) {
    // !a-z !A-Z !0-9 !_ !$
    return (
      (code < codes.a || code > codes.z) &&
      (code < codes.A || code > codes.Z) &&
      (code < codes['0'] || code > codes['9']) &&
      code !== codes._ &&
      code !== codes.$
    );
  }

  function isNumber(code) {
    return code >= codes['0'] && code <= codes['9'];
  }

  function isStringStart(code) {
    return code === codes['"'] || code === codes["'"];
  }

  function isWhiteSpace(code) {
    return (
      code === codes[' '] ||
      code === codes['\n'] ||
      code === codes['\r'] ||
      code === codes['\r\n'] ||
      code === codes['\t']
    );
  }

  function throwError(message) {
    throw new Error(message);
  }
};
