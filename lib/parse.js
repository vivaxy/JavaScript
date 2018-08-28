/**
 * @since 20180822 15:08
 * @author vivaxy
 */

const astFactory = require('../types/ast-types.js');

const astTypes = astFactory.astTypes;
const codesString = 'aftzAZ09_$"\'.\\ \n\r\t()[]+-*/%&|!^~<>=?:,;';
let codes = {};
codesString.split('').forEach((item) => {
  codes[item] = item.charCodeAt(0);
});

module.exports = function parse(input) {
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
        const startIndex = i;
        const endIndex = getStringEndIndex(code, startIndex, input);
        updateNode(
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
        updateNode(new astFactory.Identifier(getIdentifier()));
        continue;
      }

      if (isWhiteSpace(code)) {
        i++;
        continue;
      }

      if (code === codes['(']) {
        const startIndex = i;
        const endIndex = getCodeIndex(input, startIndex, codes[')']);
        const expression = parseExpressionStatement(
          input.slice(startIndex + 1, endIndex),
          depth + 1
        ).expression;
        expression.paren = true;
        updateNode(expression);
        i = endIndex + 1;
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
        let depth = 1;
        const startIndex = i;
        const endIndex = getCodeIndex(input, startIndex, codes[']']);
        consumeMemberExpression(
          parseExpressionStatement(
            input.slice(startIndex + 1, endIndex),
            depth + 1
          ).expression,
          true
        );
        i = endIndex + 1;
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
            parseExpressionStatement(
              input.slice(start + 1, colonIndex),
              depth + 1
            ).expression,
            parseExpressionStatement(
              input.slice(colonIndex + 1),
              depth + 1
            ).expression
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

    cleanUp();

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

    function cleanUp() {
      if (astFactory.isUpdateExpressionOperator(operator)) {
        // trailing ++ or --
        setPostfixUpdateOperator(expressionStatement, operator);
        operator = null;
      }
    }

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

    function consumeConditionalExpression(expression) {
      expressionStatement.expression = expression;
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
          ast.type === astTypes.MEMBER_EXPRESSION ||
          ast.type === astTypes.UPDATE_EXPRESSION ||
          ast.type === astTypes.UNARY_EXPRESSION ||
          ((ast.type === astTypes.BINARY_EXPRESSION ||
            ast.type === astTypes.LOGICAL_EXPRESSION) &&
            astFactory.binaryOperatorPrecedences[ast.operator] >=
              astFactory.binaryOperatorPrecedences[operator])
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
            astFactory.binaryOperatorPrecedences[ast.operator] >=
              astFactory.binaryOperatorPrecedences[operator])
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

    function consumeMemberExpression(expression, computed) {
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
      if (node.type !== astTypes.IDENTIFIER) {
        throwError('Update operator only works on identifier nodes');
      }
    }
  }

  function findBottomRightParentNode(root, shouldBreak) {
    let parent = null;
    let node = root;
    traverse(node);
    return parent;

    function traverse(ast) {
      if (shouldBreak(ast)) {
        return;
      }
      switch (ast.type) {
        case astTypes.EXPRESSION_STATEMENT:
          parent = ast;
          node = ast.expression;
          traverse(node);
          break;
        case astTypes.BINARY_EXPRESSION:
        case astTypes.LOGICAL_EXPRESSION:
          parent = ast;
          node = ast.right;
          traverse(node);
          break;
        case astTypes.UNARY_EXPRESSION:
          parent = ast;
          node = ast.argument;
          traverse(node);
          break;
        case astTypes.SEQUENCE_EXPRESSION:
          parent = ast;
          node = ast.expressions[ast.expressions.length - 1];
          traverse(node);
          break;
        case astTypes.CONDITIONAL_EXPRESSION:
          parent = ast;
          node = ast.alternate;
          traverse(node);
          break;
        case astTypes.MEMBER_EXPRESSION:
          parent = ast;
          node = ast.property;
          traverse(node);
          break;
        case astTypes.LITERAL:
        case astTypes.IDENTIFIER:
          break;
        default:
          throwError('Unexpected ast.type: ' + ast.type);
      }
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
        break;
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
        break;
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
