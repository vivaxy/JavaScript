/**
 * @since 20180503 11:40
 * @author vivaxy
 */

const tokenTypes = {
  ARITHMETIC_OPERATOR: 'arithmeticOperator', // +(二元), -(二元), /, *, %, **, ++, --, -(一元), +(一元)
  BITWISE_OPERATOR: 'bitwiseOperator', // &, |, ^, ~, <<, >>, >>>
  COMPARISON_OPERATOR: 'comparisonOperator', // ==, ===, >, <, <=, >=, !=, !==
  CONDITIONAL_OPERATOR: 'conditionalOperator', // ? :
  LOGICAL_OPERATOR: 'logicalOperator', // &&, ||, !
  NUMBER: 'number',
  STRING: 'string',
  BOOLEAN: 'boolean',
  PARENTHESIS: 'parenthesis',
  LABEL: 'label', // ;, ,, .
  NULL: 'null',
  IDENTIFIER: 'identifier', // 变量, undefined
};

compiler.tokenTypes = tokenTypes;

const astTypes = {
  PROGRAM: 'Program',
  EXPRESSION_STATEMENT: 'ExpressionStatement',
  LITERAL: 'Literal',
  BINARY_EXPRESSION: 'BinaryExpression',
  /**
   * void
   * +
   * -
   * !
   */
  UNARY_EXPRESSION: 'UnaryExpression',
  LOGICAL_EXPRESSION: 'LogicalExpression',
  IDENTIFIER: 'Identifier',
  SEQUENCE_EXPRESSION: 'SequenceExpression',
  CONDITIONAL_EXPRESSION: 'ConditionalExpression',

  MEMBER_EXPRESSION: 'MemberExpression',
};

compiler.astTypes = astTypes;

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence
 */
const binaryOperatorPrecedence = {
  '**': 15,
  '*': 14,
  '/': 14,
  '%': 14,
  '+': 13,
  '-': 13,
  '<': 11,
  '<=': 11,
  '>': 11,
  '>=': 11,
  '==': 10,
  '!=': 10,
  '===': 10,
  '!==': 10,
  '&': 9,
  '^': 8,
  '|': 7,
};

const astFactory = {
  PROGRAM(body) {
    return { type: astTypes.PROGRAM, body };
  },
  EXPRESSION_STATEMENT(expression) {
    return { type: astTypes.EXPRESSION_STATEMENT, expression };
  },
  LITERAL(value) {
    return { type: astTypes.LITERAL, value };
  },
  BINARY_EXPRESSION(operator, left, right) {
    return { type: astTypes.BINARY_EXPRESSION, operator, left, right };
  },
  UNARY_EXPRESSION(operator, argument) {
    return { type: astTypes.UNARY_EXPRESSION, operator, argument };
  },
  LOGICAL_EXPRESSION(operator, left, right) {
    return { type: astTypes.LOGICAL_EXPRESSION, operator, left, right };
  },
  IDENTIFIER(name) {
    return { type: astTypes.IDENTIFIER, name };
  },
  SEQUENCE_EXPRESSION(expressions) {
    return { type: astTypes.SEQUENCE_EXPRESSION, expressions };
  },
  CONDITIONAL_EXPRESSION(test, consequent, alternate) {
    return { type: astTypes.CONDITIONAL_EXPRESSION, test, consequent, alternate };
  },
  MEMBER_EXPRESSION(object, property) {
    return { type: astTypes.MEMBER_EXPRESSION, object, property };
  },
};

compiler.astFactory = astFactory;

function tokenizer(input) {
  let tokens = [];
  let i = 0;
  const length = input.length;

  function pushToken(type, value, extraLength = 0) {
    i += value.length + extraLength;
    if (type === tokenTypes.NUMBER) {
      value = Number(value);
    }
    if (type === tokenTypes.BOOLEAN) {
      value = value === 'true';
    }
    if (type === tokenTypes.NULL) {
      value = null;
    }
    tokens.push({
      type,
      value,
    });
  }

  while (i < length) {
    let char = input[i];
    if (char === ' ') {
      i++;
      continue;
    }
    if (char === ',') {
      pushToken(tokenTypes.LABEL, char);
      continue;
    }
    if (char === ';') {
      pushToken(tokenTypes.LABEL, char);
      continue;
    }
    if (char === '*' || char === '+' || char === '-') {
      const nextChar = input[i + 1];
      if (char === nextChar) {
        pushToken(tokenTypes.ARITHMETIC_OPERATOR, char + char);
        continue;
      }
      pushToken(tokenTypes.ARITHMETIC_OPERATOR, char);
      continue;
    }
    if (char === '/' || char === '%') {
      pushToken(tokenTypes.ARITHMETIC_OPERATOR, char);
      continue;
    }
    if (char === '&' || char === '|') {
      const nextChar = input[i + 1];
      if (char === nextChar) {
        pushToken(tokenTypes.LOGICAL_OPERATOR, char + char);
        continue;
      }
      pushToken(tokenTypes.BITWISE_OPERATOR, char);
      continue;
    }
    if (char === '^' || char === '~') {
      pushToken(tokenTypes.BITWISE_OPERATOR, char);
      continue;
    }
    if (char === '<') {
      const nextChar = input[i + 1];
      if (nextChar === '=') {
        pushToken(tokenTypes.COMPARISON_OPERATOR, '<=');
        continue;
      }
      if (nextChar === '<') {
        pushToken(tokenTypes.COMPARISON_OPERATOR, '<<');
        continue;
      }
      pushToken(tokenTypes.COMPARISON_OPERATOR, char);
      continue;
    }
    if (char === '>') {
      const nextChar = input[i + 1];
      if (nextChar === '=') {
        pushToken(tokenTypes.COMPARISON_OPERATOR, '>=');
        continue;
      }
      if (nextChar === '>') {
        if (input[i + 2] === '>') {
          pushToken(tokenTypes.COMPARISON_OPERATOR, '>>>');
          continue;
        }
        pushToken(tokenTypes.COMPARISON_OPERATOR, '>>');
        continue;
      }
      pushToken(tokenTypes.COMPARISON_OPERATOR, char);
      continue;
    }
    if (char === '=') {
      const nextChar = input[i + 1];
      if (nextChar === '=') {
        if (input[i + 2] === '=') {
          pushToken(tokenTypes.COMPARISON_OPERATOR, '===');
          continue;
        }
        pushToken(tokenTypes.COMPARISON_OPERATOR, '==');
        continue;
      }
      pushToken(tokenTypes.COMPARISON_OPERATOR, char);
      continue;
    }
    if (char === '!') {
      const nextChar = input[i + 1];
      if (nextChar === '=') {
        if (input[i + 2] === '=') {
          pushToken(tokenTypes.COMPARISON_OPERATOR, '!==');
          continue;
        }
        pushToken(tokenTypes.COMPARISON_OPERATOR, '!=');
        continue;
      }
      pushToken(tokenTypes.LOGICAL_OPERATOR, char);
      continue;
    }
    if (char === '?' || char === ':') {
      pushToken(tokenTypes.CONDITIONAL_OPERATOR, char);
      continue;
    }
    if (char === '{') {
      if (input[i + 1] === '{') {
        let j = 2;
        char = input[i + j];
        let value = '';
        while (i < length && char !== '}') {
          value += char;
          j++;
          char = input[i + j];
        }
        if (input[i + j + 1] === '}') {
          if (value !== '') {
            pushToken(tokenTypes.IDENTIFIER, value, 4);
            continue;
          }
        }
      }
    }
    const NUMBERS = /[0-9]/;
    if (NUMBERS.test(char) || (char === '.' && NUMBERS.test(input[i + 1]))) {
      let value = '';
      let j = 0;
      while (NUMBERS.test(char) || char === '.') {
        value += char;
        j++;
        char = input[i + j];
      }
      pushToken(tokenTypes.NUMBER, value);
      continue;
    }

    // match label after number
    if (char === '.') {
      pushToken(tokenTypes.LABEL, '.');
      continue;
    }

    if (char === '"') {
      let value = '';
      let j = 1;
      char = input[i + j];
      while (char !== '"') {
        value += char;
        j++;
        char = input[i + j];
      }
      pushToken(tokenTypes.STRING, value, 2);
      continue;
    }
    if (char === '\'') {
      let value = '';
      let j = 1;
      char = input[i + j];
      while (char !== '\'') {
        value += char;
        j++;
        char = input[i + j];
      }
      pushToken(tokenTypes.STRING, value, 2);
      continue;
    }
    if (char === '(' || char === ')') {
      pushToken(tokenTypes.PARENTHESIS, char);
      continue;
    }
    if (matchToken('void', tokenTypes.LABEL)) {
      continue;
    }
    if (matchToken('true', tokenTypes.BOOLEAN)) {
      continue;
    }
    if (matchToken('false', tokenTypes.BOOLEAN)) {
      continue;
    }
    if (matchToken('null', tokenTypes.NULL)) {
      continue;
    }
    if (matchToken('undefined', tokenTypes.IDENTIFIER)) {
      continue;
    }
    if (matchIdentifier()) {
      continue;
    }

    function matchToken(pattern, tokenType) {
      if (input.slice(i, i + pattern.length) === pattern) {
        pushToken(tokenType, pattern);
        return true;
      }
      return false;
    }

    function matchIdentifier() {
      let value = char;
      let j = i + 1;
      let nextChar = input[j];
      const breakChars = [';', '+', '-', '*', '/', '<', '>', '=', '(', ')', '%', '&', '|', '^', '~', '!', '?', ':', ',', '.'];
      while (nextChar && breakChars.indexOf(nextChar) === -1) {
        value += nextChar;
        j++;
        nextChar = input[j];
      }
      pushToken(tokenTypes.IDENTIFIER, value);
      return true;
    }

    throw new Error('Unexpected token: ' + char);
  }
  return tokens;
}

compiler.tokenizer = tokenizer;

function parser(inputTokens) {

  return astFactory.PROGRAM(getStatements(inputTokens));

  function getGrouping(tokens) {
    let i = 0;
    let retTokens = [];
    while (i < tokens.length) {

      const token = tokens[i];
      if (token.type === tokenTypes.PARENTHESIS && token.value === '(') {
        const { expression, offset } = getGrouping(tokens.slice(i + 1));
        retTokens.push(expression);
        i += offset;
      } else if (token.type === tokenTypes.PARENTHESIS && token.value === ')') {
        return {
          expression: getExpression(retTokens),
          offset: i + 1,
        };
      } else {
        retTokens.push({
          type: token.type,
          value: token.value,
          isToken: true,
        });
      }
      i++;
    }

    return {
      expression: getExpression(retTokens),
      offset: i,
    }

  }

  function getLogicalExpression(tokens) {
    let logicalExpressionIndex = -1;
    for (let i = tokens.length - 1; i >= 0; i--) {
      // && precedence is higher than ||
      if (tokens[i].type === tokenTypes.LOGICAL_OPERATOR && tokens[i].value === '&&') {
        logicalExpressionIndex = i;
      }
    }
    for (let i = tokens.length - 1; i >= 0; i--) {
      if (tokens[i].type === tokenTypes.LOGICAL_OPERATOR && tokens[i].value === '||') {
        logicalExpressionIndex = i;
      }
    }

    if (logicalExpressionIndex !== -1) {
      return astFactory.LOGICAL_EXPRESSION(
        tokens[logicalExpressionIndex].value,
        getExpression(tokens.slice(0, logicalExpressionIndex)),
        getExpression(tokens.slice(logicalExpressionIndex + 1)),
      );
    }
    return null;
  }

  function getBinaryExpression(tokens) {
    let operatorIndex = -1;
    let i = tokens.length - 1;
    while (i >= 0) {
      const token = tokens[i];
      const nextToken = tokens[i - 1];
      if (
        nextToken &&
        (
          (
            token.type === tokenTypes.ARITHMETIC_OPERATOR ||
            token.type === tokenTypes.COMPARISON_OPERATOR ||
            (
              token.type === tokenTypes.BITWISE_OPERATOR &&
              (
                token.value === '&' ||
                token.value === '|' ||
                token.value === '^'
              )
            )
          ) &&
          (
            nextToken.type === tokenTypes.NUMBER ||
            nextToken.type === tokenTypes.STRING ||
            nextToken.type === tokenTypes.BOOLEAN ||
            nextToken.type === tokenTypes.IDENTIFIER ||
            nextToken.type === tokenTypes.NULL ||
            nextToken.type === astTypes.BINARY_EXPRESSION ||
            nextToken.type === astTypes.LOGICAL_EXPRESSION
            // maybe other
          )
        )
      ) {
        // valid binary operator
        if (operatorIndex === -1) {
          operatorIndex = i;
        } else if (operatorIndex !== -1) {
          const nextToken = tokens[operatorIndex].value;
          const currToken = token.value;
          if (!binaryOperatorPrecedence[nextToken]) {
            throw new Error('Missing operator precedence: ' + nextToken);
          }
          if (!binaryOperatorPrecedence[currToken]) {
            throw new Error('Missing operator precedence: ' + currToken);
          }
          if (binaryOperatorPrecedence[nextToken] > binaryOperatorPrecedence[currToken]) {
            operatorIndex = i;
          }
        }
      }
      i--;
    }
    if (operatorIndex === -1) {
      return null;
    }
    if (operatorIndex === 0) {
      return null;
    }
    if (operatorIndex === tokens.length - 1) {
      return null;
    }

    return astFactory.BINARY_EXPRESSION(
      tokens[operatorIndex].value,
      getExpression(tokens.slice(0, operatorIndex)),
      getExpression(tokens.slice(operatorIndex + 1)),
    );
  }

  function getUnaryExpression(tokens) {
    const token = tokens[0];
    if (
      (token.type === tokenTypes.ARITHMETIC_OPERATOR && (
        token.value === '-' ||
        token.value === '+'
      )) ||
      (token.type === tokenTypes.LOGICAL_OPERATOR && token.value === '!') ||
      (token.type === tokenTypes.LABEL && token.value === 'void') ||
      (token.type === tokenTypes.BITWISE_OPERATOR && token.value === '~')
    ) {
      return astFactory.UNARY_EXPRESSION(token.value, getLiteralOrIdentifier(tokens.slice(1)));
    }
    return null;
  }

  function getLiteralOrIdentifier(tokens) {
    if (tokens.length !== 1) {
      return null;
    }
    const token = tokens[0];
    if (token.type === astTypes.BINARY_EXPRESSION || token.type === astTypes.LOGICAL_EXPRESSION || token.type === astTypes.LITERAL || token.type === astTypes.IDENTIFIER) {
      return token;
    } else if (token.type === tokenTypes.IDENTIFIER) {
      return getIdentifier(tokens);
    } else {
      return getLiteral(tokens);
    }
  }

  function getIdentifier(tokens) {
    if (tokens.length !== 1) {
      throw new Error('Unexpected identifier count');
    }
    const token = tokens[0];
    if (token.type === tokenTypes.IDENTIFIER) {
      return astFactory.IDENTIFIER(token.value);
    }
    throw new Error('Unexpected identifier token type: ' + token.type);
  }

  function getLiteral(tokens) {
    if (tokens.length !== 1) {
      throw new Error('Unexpected literal count');
    }
    const token = tokens[0];
    if (token.type === tokenTypes.NUMBER || token.type === tokenTypes.STRING || token.type === tokenTypes.BOOLEAN || token.type === tokenTypes.NULL) {
      return astFactory.LITERAL(token.value);
    }
    throw new Error('Unexpected literal token type: ' + token.type);
  }

  function getSequenceExpressions(tokens) {
    let sequenceExpressions = [];
    let prevStart = 0;
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type === tokenTypes.LABEL && tokens[i].value === ',') {
        sequenceExpressions.push(getExpression(tokens.slice(prevStart, i)));
        prevStart = i + 1;
      }
    }
    if (prevStart !== 0) {
      sequenceExpressions.push(getExpression(tokens.slice(prevStart)));
    }
    if (sequenceExpressions.length) {
      return astFactory.SEQUENCE_EXPRESSION(sequenceExpressions);
    }
    return null;
  }

  function getConditionalExpression(tokens) {
    let questionMarkIndex = -1;
    let colonIndex = -1;
    for (let i = 0; i < tokens.length; i++) {
      if (questionMarkIndex !== -1 && colonIndex !== -1) {
        break;
      }
      if (questionMarkIndex === -1 && tokens[i].type === tokenTypes.CONDITIONAL_OPERATOR && tokens[i].value === '?') {
        questionMarkIndex = i;
      }
      if (colonIndex === -1 && tokens[i].type === tokenTypes.CONDITIONAL_OPERATOR && tokens[i].value === ':') {
        colonIndex = i;
      }
    }
    if (questionMarkIndex === -1 || colonIndex === -1) {
      return null;
    }
    return astFactory.CONDITIONAL_EXPRESSION(getExpression(tokens.slice(0, questionMarkIndex)), getExpression(tokens.slice(questionMarkIndex + 1, colonIndex)), getExpression(tokens.slice(colonIndex + 1)));
  }

  function getMemberExpression(tokens) {
    if (tokens.length < 3) {
      return null;
    }
    // identifier + label(.) + identify + ...
    if (tokens[0].type !== tokenTypes.IDENTIFIER || tokens[tokens.length - 1].type !== tokenTypes.IDENTIFIER) {
      return null;
    }
    let expecting = tokenTypes.IDENTIFIER;
    let identifiers = [];
    let i = 0;
    while (
      i < tokens.length && (
        (tokens[i].type === expecting && expecting === tokenTypes.LABEL && tokens[i].value === '.')
        || (tokens[i].type === expecting && expecting === tokenTypes.IDENTIFIER)
      )
      ) {
      if (tokens[i].type === tokenTypes.IDENTIFIER) {
        identifiers.push(tokens[i]);
      }
      i++;
      if (expecting === tokenTypes.LABEL) {
        expecting = tokenTypes.IDENTIFIER;
      } else {
        expecting = tokenTypes.LABEL;
      }
    }

    if (expecting === tokenTypes.IDENTIFIER && i !== tokens.length - 1) {
      return null;
    }

    let object = astFactory.IDENTIFIER(identifiers[0].value);

    for (let j = 1; j < identifiers.length; j++) {
      object = astFactory.MEMBER_EXPRESSION(object, astFactory.IDENTIFIER(identifiers[j].value));
    }
    return object;
  }

  function getExpression(tokens) {
    const literal = getLiteralOrIdentifier(tokens);
    if (literal) {
      return literal;
    }

    const sequenceExpressions = getSequenceExpressions(tokens); // 1
    if (sequenceExpressions) {
      return sequenceExpressions;
    }

    const conditionalExpression = getConditionalExpression(tokens); // 4
    if (conditionalExpression) {
      return conditionalExpression;
    }

    const logicalExpression = getLogicalExpression(tokens); // 5, 6
    if (logicalExpression) {
      return logicalExpression;
    }

    const binaryExpression = getBinaryExpression(tokens); // 7, 8, 9, 10, 11, 12, 13, 14, 15
    if (binaryExpression) {
      return binaryExpression;
    }

    const unaryExpression = getUnaryExpression(tokens); // 16
    if (unaryExpression) {
      return unaryExpression;
    }

    const memberExpression = getMemberExpression(tokens); // 19
    if (memberExpression) {
      return memberExpression;
    }

    throw new Error('Unexpected expression');
  }

  function getStatements(tokens) {
    let start = 0;
    const end = tokens.length - 1;
    let statements = [];
    for (let i = start; i <= end; i++) {
      if (tokens[i].type === tokenTypes.LABEL && tokens[i].value === ';') {
        statements.push(astFactory.EXPRESSION_STATEMENT(getGrouping(tokens.slice(start, i)).expression));
        start = i + 1;
      }
    }
    if (tokens[end].type === tokenTypes.LABEL && tokens[end].value === ';') {
      statements.push(astFactory.EXPRESSION_STATEMENT(getGrouping(tokens.slice(start, end)).expression));
    } else {
      statements.push(astFactory.EXPRESSION_STATEMENT(getGrouping(tokens.slice(start, end + 1)).expression));
    }
    return statements;
  }

}

compiler.parser = parser;

/**
 * @param ast
 * @param scope containing arguments
 * @returns {*}
 */
function execute(ast, scope) {
  if (ast.type === astTypes.PROGRAM) {
    for (let i = 0, l = ast.body.length - 1; i < l; i++) {
      execute(ast.body[i], scope);
    }
    return execute(ast.body[ast.body.length - 1], scope);
  }
  if (ast.type === astTypes.EXPRESSION_STATEMENT) {
    return execute(ast.expression, scope);
  }
  if (ast.type === astTypes.SEQUENCE_EXPRESSION) {
    for (let i = 0; i < ast.expressions.length - 1; i++) {
      execute(ast.expressions[i], scope);
    }
    return execute(ast.expressions[ast.expressions.length - 1], scope);
  }
  if (ast.type === astTypes.LOGICAL_EXPRESSION) {
    if (ast.operator === '&&') {
      return execute(ast.left, scope) && execute(ast.right, scope);
    }
    if (ast.operator === '||') {
      return execute(ast.left, scope) || execute(ast.right, scope);
    }
    throw new Error('Unexpected LOGICAL_EXPRESSION operator: ' + ast.operator);
  }
  if (ast.type === astTypes.BINARY_EXPRESSION) {
    if (ast.operator === '===') {
      return execute(ast.left, scope) === execute(ast.right, scope);
    }
    if (ast.operator === '==') {
      return execute(ast.left, scope) == execute(ast.right, scope);
    }
    if (ast.operator === '>') {
      return execute(ast.left, scope) > execute(ast.right, scope);
    }
    if (ast.operator === '<') {
      return execute(ast.left, scope) < execute(ast.right, scope);
    }
    if (ast.operator === '<=') {
      return execute(ast.left, scope) <= execute(ast.right, scope);
    }
    if (ast.operator === '>=') {
      return execute(ast.left, scope) >= execute(ast.right, scope);
    }
    if (ast.operator === '!=') {
      return execute(ast.left, scope) != execute(ast.right, scope);
    }
    if (ast.operator === '!==') {
      return execute(ast.left, scope) !== execute(ast.right, scope);
    }
    if (ast.operator === '+') {
      return execute(ast.left, scope) + execute(ast.right, scope);
    }
    if (ast.operator === '-') {
      return execute(ast.left, scope) - execute(ast.right, scope);
    }
    if (ast.operator === '*') {
      return execute(ast.left, scope) * execute(ast.right, scope);
    }
    if (ast.operator === '/') {
      return execute(ast.left, scope) / execute(ast.right, scope);
    }
    if (ast.operator === '%') {
      return execute(ast.left, scope) % execute(ast.right, scope);
    }
    if (ast.operator === '**') {
      return execute(ast.left, scope) ** execute(ast.right, scope);
    }
    if (ast.operator === '&') {
      return execute(ast.left, scope) & execute(ast.right, scope);
    }
    if (ast.operator === '|') {
      return execute(ast.left, scope) | execute(ast.right, scope);
    }
    if (ast.operator === '^') {
      return execute(ast.left, scope) ^ execute(ast.right, scope);
    }
    if (ast.operator === '>>') {
      return execute(ast.left, scope) >> execute(ast.right, scope);
    }
    if (ast.operator === '<<') {
      return execute(ast.left, scope) << execute(ast.right, scope);
    }
    if (ast.operator === '>>>') {
      return execute(ast.left, scope) >>> execute(ast.right, scope);
    }
    throw new Error('Unexpected BINARY_EXPRESSION operator: ' + ast.operator);
  }
  if (ast.type === astTypes.LITERAL) {
    return ast.value;
  }
  if (ast.type === astTypes.UNARY_EXPRESSION) {
    if (ast.operator === '-') {
      return -ast.argument.value;
    }
    if (ast.operator === '+') {
      return +ast.argument.value;
    }
    if (ast.operator === '!') {
      return !ast.argument.value;
    }
    if (ast.operator === 'void') {
      return undefined;
    }
    if (ast.operator === '~') {
      return ~ast.argument.value;
    }
    throw new Error('Unexpected UNARY_EXPRESSION operator: ' + ast.operator);
  }
  if (ast.type === astTypes.IDENTIFIER) {
    if (ast.name === 'undefined') {
      return undefined;
    }
    if (scope.hasOwnProperty(ast.name)) {
      return scope[ast.name];
    }
    throw new Error('Unexpected identifier name: ' + ast.name);
  }
  if (ast.type === astTypes.CONDITIONAL_EXPRESSION) {
    return execute(ast.test) ? execute(ast.consequent) : execute(ast.alternate);
  }
  throw new Error('Unexpected ast type: ' + ast.type);
}

compiler.execute = execute;

const stringifyTypes = {
  [astTypes.PROGRAM](ast) {
    return ast.body.map((_ast) => {
      return this[astTypes.EXPRESSION_STATEMENT](_ast);
    }).join(';\n');
  },
  [astTypes.EXPRESSION_STATEMENT](ast) {
    return this[ast.expression.type](ast.expression);
  },
  [astTypes.LITERAL](ast) {
    if (typeof ast.value === 'string') {
      return '\'' + ast.value + '\'';
    } else if (typeof ast.value === 'number') {
      return ast.value;
    }
    throw new Error('Unexpected typeof ast.value: ' + typeof ast.value);
  },
  [astTypes.IDENTIFIER](ast) {
    return ast.name;
  },
  [astTypes.BINARY_EXPRESSION](ast) {
    return '(' + this[ast.left.type](ast.left) + ' ' + ast.operator + ' ' + this[ast.right.type](ast.right) + ')';
  },
  [astTypes.UNARY_EXPRESSION](ast) {
    throw new Error('Unexpected ast.type: ' + ast.type);
  },
  [astTypes.LOGICAL_EXPRESSION](ast) {
    return '(' + this[ast.left.type](ast.left) + ' ' + ast.operator + ' ' + this[ast.right.type](ast.right) + ')';
  },
  [astTypes.SEQUENCE_EXPRESSION](ast) {
    return ast.expressions.map((_ast) => {
      return this[astTypes.EXPRESSION_STATEMENT](_ast);
    }).join(', ');
  },
  [astTypes.CONDITIONAL_EXPRESSION](ast) {
    return '(' + this[ast.test.type](ast.type) + ' ? ' +
      this[ast.consequent.type](ast.consequent) + ' : ' + this[ast.alternate.type](ast.alternate) + ')';
  },
  [astTypes.MEMBER_EXPRESSION](ast) {
    return this[ast.object.type](ast.object) + '.' + ast.property.name;
  },
};

function stringify(ast) {
  return stringifyTypes[ast.type](ast);
}

compiler.stringify = stringify;

function compiler(input, scope) {
  const tokens = tokenizer(input);
  const ast = parser(tokens);
  return execute(ast, scope);
}

module.exports = compiler;
