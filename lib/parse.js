/**
 * @since 20180822 15:08
 * @author vivaxy
 */

const astTypes = require('../helpers/ast-types.js');
const astFactory = require('../helpers/ast-factory.js');
const traverse = require('./traverse.js');
const binaryOperatorPrecedences = require('../helpers/binary-operator-precedences.js');

const codesString = 'azAZ09_$"\'.\\ \n\r\t()[]+-*/%&|!^~<>=?:,;';
let codes = {};
codesString.split('').forEach((item) => {
  codes[item] = item.charCodeAt(0);
});

module.exports = function parse(input) {
  let i = 0;

  let program = new astFactory.Program([]);
  while (i < input.length) {
    program.body.push(parseExpressionStatement(i, input.length, 0));
  }

  return program;

  function parseExpressionStatement(startIndex, endIndex) {
    let expressionStatement = null;
    let operator = null;
    let secondOperator = null;
    i = startIndex;

    while (i < endIndex) {
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
        consumeNode(new astFactory.Literal(Number(input.slice(start, i))));
        continue;
      }

      if (matchToken('true')) {
        i += 4;
        consumeNode(new astFactory.Literal(true));
        continue;
      }

      if (matchToken('false')) {
        i += 5;
        consumeNode(new astFactory.Literal(false));
        continue;
      }

      if (matchToken('null')) {
        i += 4;
        consumeNode(new astFactory.Literal(null));
        continue;
      }

      if (matchToken('undefined')) {
        i += 9;
        consumeNode(new astFactory.Identifier('undefined'));
        continue;
      }

      if (isStringStart(code)) {
        const startIndex = i;
        const endIndex = getStringEndIndex(code, startIndex, input);
        consumeNode(
          new astFactory.Literal(input.slice(startIndex + 1, endIndex))
        );
        i = endIndex + 1;
        continue;
      }

      if (matchToken('void')) {
        operator ? (secondOperator = 'void') : (operator = 'void');
        i += 4;
        continue;
      }

      if (isIdentifierStart(code)) {
        consumeNode(new astFactory.Identifier(getIdentifier()));
        continue;
      }

      if (isWhiteSpace(code)) {
        i++;
        continue;
      }

      if (code === codes['(']) {
        const _endIndex = getCodeIndex(input, i, codes[')']);
        /**
         * (a, b)
         */
        const expr = parseExpressionStatement(i + 1, _endIndex).expression;
        consumeParenNodes(expr);
        i = _endIndex + 1;
        continue;
      }

      if (code === codes['.']) {
        i++;
        consumeMemberExpression(
          new astFactory.Identifier(getIdentifier()),
          false
        );
        continue;
      }

      if (code === codes['[']) {
        const _startIndex = i;
        const _endIndex = getCodeIndex(input, _startIndex, codes[']']);
        if (operator || secondOperator || !expressionStatement) {
          consumeArrayExpression(_startIndex + 1, _endIndex);
        } else {
          consumeMemberExpression(
            parseExpressionStatement(_startIndex + 1, _endIndex).expression,
            true
          );
        }
        i = _endIndex + 1;
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
        const colonIndex = getCodeIndex(input, start, codes[':']);
        cleanUp();
        consumeConditionalExpression(
          new astFactory.ConditionalExpression(
            expressionStatement.expression,
            parseExpressionStatement(start + 1, colonIndex).expression,
            parseExpressionStatement(colonIndex + 1, endIndex).expression
          )
        );
        i = endIndex;
        break;
      }

      if (code === codes[',']) {
        // sequence or array or object
        i++;
        break;
      }

      if (code === codes[';']) {
        // next statement
        i++;
        continue;
      }

      throwError('Unexpected token: ' + String.fromCharCode(code));
    }

    cleanUp();

    if (operator || secondOperator) {
      throwError('Error operator: ' + (operator || secondOperator));
    }
    return expressionStatement;

    function cleanUp() {
      if (astFactory.isUpdateExpressionOperator(operator)) {
        // trailing ++ or --
        setPostfixUpdateOperator(expressionStatement, operator);
        operator = null;
      }

      // support sequence expression
      if (input.charCodeAt(i - 1) === codes[',']) {
        // is sequence expression
        expressionStatement.expression = new astFactory.SequenceExpression([
          expressionStatement.expression,
        ]);
        while (i < endIndex) {
          const expr = parseExpressionStatement(i, endIndex);
          expressionStatement.expression.expressions.push(expr.expression);
        }
      }
    }

    function consumeParenNodes(expr) {
      if (
        operator === null &&
        secondOperator === null &&
        expressionStatement !== null
      ) {
        return consumeCallExpression(expr);
      }
      expr.paren = true;
      return consumeNode(expr);
    }

    function consumeNode(node) {
      if (expressionStatement === null) {
        if (astFactory.isUnaryExpressionOperator(operator)) {
          expressionStatement = new astFactory.ExpressionStatement(
            new astFactory.UnaryExpression(operator, node)
          );
          return (operator = null);
        }
        if (astFactory.isUpdateExpressionOperator(operator)) {
          expressionStatement = new astFactory.ExpressionStatement(
            new astFactory.UpdateExpression(operator, node, true)
          );
          return (operator = null);
        }
        return (expressionStatement = new astFactory.ExpressionStatement(node));
      }

      if (astFactory.isBinaryExpressionOperator(operator)) {
        node = consumeSecondOperator(node);
        consumeBinaryExpression(node);
        return (operator = null);
      }
      if (astFactory.isLogicalExpressionOperator(operator)) {
        node = consumeSecondOperator(node);
        consumeLogicalExpression(node);
        return (operator = null);
      }
      throwError('Unexpected operator: ' + operator);
    }

    function consumeConditionalExpression(expr) {
      expressionStatement.expression = expr;
    }

    function consumeCallExpression(expr) {
      let exprs = [];
      if (expr.type === astTypes.SEQUENCE_EXPRESSION) {
        exprs = expr.expressions;
      } else {
        exprs = [expr];
      }
      expressionStatement.expression = new astFactory.CallExpression(
        expressionStatement.expression,
        exprs
      );
    }

    function consumeBinaryExpression(node) {
      const parent = findBottomRightParentNode(
        expressionStatement,
        shouldBreak
      );

      switch (parent.type) {
        case astTypes.EXPRESSION_STATEMENT:
          parent.expression = new astFactory.BinaryExpression(
            operator,
            parent.expression,
            node
          );
          break;
        case astTypes.BINARY_EXPRESSION:
        case astTypes.LOGICAL_EXPRESSION:
          parent.right = new astFactory.BinaryExpression(
            operator,
            parent.right,
            node
          );
          break;
        default:
          throwError('Unexpected parent.type: ' + parent.type);
      }

      function shouldBreak(ast) {
        return (
          ast.paren ||
          ast.type === astTypes.CALL_EXPRESSION ||
          ast.type === astTypes.MEMBER_EXPRESSION ||
          ast.type === astTypes.UPDATE_EXPRESSION ||
          ast.type === astTypes.UNARY_EXPRESSION ||
          ((ast.type === astTypes.BINARY_EXPRESSION ||
            ast.type === astTypes.LOGICAL_EXPRESSION) &&
            binaryOperatorPrecedences[ast.operator] >=
              binaryOperatorPrecedences[operator])
        );
      }
    }

    function consumeLogicalExpression(node) {
      const parent = findBottomRightParentNode(
        expressionStatement,
        shouldBreak
      );

      switch (parent.type) {
        case astTypes.EXPRESSION_STATEMENT:
          parent.expression = new astFactory.LogicalExpression(
            operator,
            parent.expression,
            node
          );
          break;
        case astTypes.BINARY_EXPRESSION:
        case astTypes.LOGICAL_EXPRESSION:
          parent.right = new astFactory.LogicalExpression(
            operator,
            parent.right,
            node
          );
          break;
        default:
          throwError('Unexpected parent.type: ' + parent.type);
      }

      function shouldBreak(ast) {
        return (
          ast.paren ||
          ast.type === astTypes.MEMBER_EXPRESSION ||
          ast.type === astTypes.UPDATE_EXPRESSION ||
          ast.type === astTypes.UNARY_EXPRESSION ||
          ((ast.type === astTypes.BINARY_EXPRESSION ||
            ast.type === astTypes.LOGICAL_EXPRESSION) &&
            binaryOperatorPrecedences[ast.operator] >=
              binaryOperatorPrecedences[operator])
        );
      }
    }

    function consumeMemberExpression(expr, computed) {
      const parent = findBottomRightParentNode(
        expressionStatement,
        shouldBreak
      );

      switch (parent.type) {
        case astTypes.EXPRESSION_STATEMENT:
          parent.expression = new astFactory.MemberExpression(
            parent.expression,
            expr,
            computed
          );
          break;
        case astTypes.BINARY_EXPRESSION:
        case astTypes.LOGICAL_EXPRESSION:
          parent.right = new astFactory.MemberExpression(
            parent.right,
            expr,
            computed
          );
          break;
        case astTypes.UNARY_EXPRESSION:
        case astTypes.UPDATE_EXPRESSION:
          parent.argument = new astFactory.MemberExpression(
            parent.argument,
            expr,
            computed
          );
          break;
        default:
          throwError('Unexpected parent.type: ' + parent.type);
      }

      function shouldBreak(ast) {
        return (
          ast.paren ||
          ast.type === astTypes.MEMBER_EXPRESSION ||
          ast.type === astTypes.ARRAY_EXPRESSION
        );
      }
    }

    function consumeSecondOperator(node) {
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

    function consumeArrayExpression(_startIndex, _endIndex) {
      // [1,[2,3]]
      i = _startIndex;
      let start = i;
      const arrayExpression = new astFactory.ArrayExpression([]);
      while (i < _endIndex) {
        let code = input.charCodeAt(i);
        if (code === codes[',']) {
          arrayExpression.elements.push(
            parseExpressionStatement(start, i).expression
          );
          start = i + 1;
        }
        i++;
      }
      if (start !== i) {
        // support `[]`
        arrayExpression.elements.push(
          parseExpressionStatement(start, i).expression
        );
      }
      consumeNode(arrayExpression);
    }
  }
};

function throwError(message) {
  throw new Error(message);
}

function getStringEndIndex(startCode, startIndex, input) {
  let i = startIndex;
  let code;
  while (i < input.length) {
    i++;
    code = input.charCodeAt(i);
    if (code === codes['\\']) {
      continue;
    }
    if (code === startCode) {
      break;
    }
  }
  return i;
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

function setPostfixUpdateOperator(root, operator) {
  const parent = findBottomRightParentNode(root, shouldBreak);

  switch (parent.type) {
    case astTypes.EXPRESSION_STATEMENT:
      checkIdentifier(parent.expression);
      parent.expression = new astFactory.UpdateExpression(
        operator,
        parent.expression,
        false
      );
      break;
    case astTypes.BINARY_EXPRESSION:
    case astTypes.LOGICAL_EXPRESSION:
      checkIdentifier(parent.right);
      parent.right = new astFactory.UpdateExpression(
        operator,
        parent.right,
        false
      );
      break;
    case astTypes.UNARY_EXPRESSION:
      checkIdentifier(parent.argument);
      parent.argument = new astFactory.UpdateExpression(
        operator,
        parent.argument,
        false
      );
      break;
    case astTypes.CONDITIONAL_EXPRESSION:
      checkIdentifier(parent.alternate);
      parent.alternate = new astFactory.UpdateExpression(
        operator,
        parent.alternate,
        false
      );
      break;
    default:
      throwError('Unexpected parent.type: ' + parent.type);
  }

  function shouldBreak(ast) {
    return ast.type === astTypes.MEMBER_EXPRESSION;
  }

  function checkIdentifier(node) {
    if (
      node.type !== astTypes.IDENTIFIER &&
      node.type !== astTypes.MEMBER_EXPRESSION
    ) {
      throwError('Update operator only works on identifier nodes');
    }
  }
}

function findBottomRightParentNode(root, shouldBreak) {
  let parent = null;
  let node = root;
  traverse(node, visitor);
  return parent;

  function visitor(_node, _parent) {
    node = _node;
    parent = _parent;
    if (shouldBreak(_node)) {
      return false;
    }
  }
}

function getCodeIndex(input, startIndex, toCode) {
  let i = startIndex;
  let code;

  let parenDepth = 0;
  let computedMemberAccessDepth = 0;

  while (i < input.length) {
    i++;
    code = input.charCodeAt(i);
    if (code === codes["'"] || code === codes['"']) {
      i = getStringEndIndex(code, i, input);
      continue;
    }
    if (code === codes['(']) {
      parenDepth++;
      continue;
    }
    if (code === codes[')']) {
      parenDepth--;
      if (parenDepth < 0) {
        if (toCode === code) {
          break;
        }
        throwError('Unexpected token: ' + String.fromCharCode(code));
      }
      continue;
    }
    if (code === codes['[']) {
      computedMemberAccessDepth++;
      continue;
    }
    if (code === codes[']']) {
      computedMemberAccessDepth--;
      if (computedMemberAccessDepth < 0) {
        if (toCode === code) {
          break;
        }
        throwError('Unexpected token: ' + String.fromCharCode(code));
      }
      continue;
    }
    if (
      code === toCode &&
      parenDepth === 0 &&
      computedMemberAccessDepth === 0
    ) {
      break;
    }
  }

  return i;
}
