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

  return new astFactory.Program([parseExpressionStatement(input)]);

  function parseExpressionStatement(input) {
    let expressionStatement = null;
    let i = 0;
    let operator = null;

    while (i < input.length) {
      let code = input.charCodeAt(i);

      if (isIdentifierStart(code)) {
        updateNode(new astFactory.Identifier(getIdentifier()));
        continue;
      }

      if (isNumber(code)) {
        const start = i;
        while (i < input.length) {
          i++;
          code = input.charCodeAt(i);
          if (!isNumber(code)) {
            break;
          }
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
          parseExpressionStatement(input.slice(startIndex + 1, i)).expression
        );
        i++;
        continue;
      }

      if (code === codes['.']) {
        i++;
        updateMemberExpression(new astFactory.Identifier(getIdentifier()));
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
          parseExpressionStatement(input.slice(startIndex + 1, i)).expression
        );
        i++;
        continue;
      }

      if (code === codes['+'] || code === codes['-']) {
        if (matchToken('++')) {
          operator = '++';
          i += 2;
          maybeUpdateExpression();
          continue;
        }
        if (matchToken('--')) {
          operator = '--';
          i += 2;
          maybeUpdateExpression();
          continue;
        }

        operator = String.fromCharCode(code);
        i++;
        continue;
      }

      if (code === codes['!'] || code === codes['~']) {
        operator = String.fromCharCode(code);
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

      if (code === codes[';']) {
        i++;
        continue;
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

      throwError('Unexpected token: ' + String.fromCharCode(code));
    }

    return expressionStatement;

    function updateNode(newNode) {
      if (expressionStatement === null) {
        return (expressionStatement = new astFactory.ExpressionStatement(
          newNode
        ));
      }
      if (
        newNode.type === astTypes.IDENTIFIER &&
        (operator === '++' || operator === '--')
      ) {
        expressionStatement.expression = new astFactory.UpdateExpression(
          operator,
          newNode,
          false
        );
        return (operator = null);
      }
      if (
        operator === '===' ||
        operator === '==' ||
        operator === '!==' ||
        operator === '!=' ||
        operator === '+' ||
        operator === '-'
      ) {
        if (
          expressionStatement.expression.type === astTypes.LOGICAL_EXPRESSION
        ) {
          expressionStatement.expression.right = new astFactory.BinaryExpression(
            operator,
            expressionStatement.expression.right,
            newNode
          );
        } else {
          expressionStatement.expression = new astFactory.BinaryExpression(
            operator,
            expressionStatement.expression,
            newNode
          );
        }
        return (operator = null);
      }
      if (operator === '&&' || operator === '||') {
        expressionStatement.expression = new astFactory.LogicalExpression(
          operator,
          expressionStatement.expression,
          newNode
        );
        return (operator = null);
      }
      throwError('Unexpected operator: ' + operator);
    }

    function updateMemberExpression(expression) {
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
                expression
              );
            } else {
              setMemberExpression(node.expression);
            }
            break;
          default:
            throwError('Unexpected node type: ' + node.type);
        }
      }
    }

    function maybeUpdateExpression() {
      if (
        expressionStatement.type === astTypes.IDENTIFIER ||
        expressionStatement.type === astTypes.MEMBER_EXPRESSION
      ) {
        expressionStatement = new astFactory.UpdateExpression(
          operator,
          expressionStatement,
          true
        );
        return (operator = null);
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
