/**
 * @since 20180731 11:05
 * @author vivaxy
 */

const astFactory = require('../types/ast-types.js');
const { tokenTypes } = require('../types/token-types.js');

const astTypes = astFactory.astTypes;

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

module.exports = function parser(inputTokens) {
  return new astFactory.Program(getStatements(inputTokens));

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
    };
  }

  function getLogicalExpression(tokens) {
    let logicalExpressionIndex = -1;
    for (let i = tokens.length - 1; i >= 0; i--) {
      // && precedence is higher than ||
      if (
        tokens[i].type === tokenTypes.LOGICAL_OPERATOR &&
        tokens[i].value === '&&'
      ) {
        logicalExpressionIndex = i;
      }
    }
    for (let i = tokens.length - 1; i >= 0; i--) {
      if (
        tokens[i].type === tokenTypes.LOGICAL_OPERATOR &&
        tokens[i].value === '||'
      ) {
        logicalExpressionIndex = i;
      }
    }

    if (logicalExpressionIndex !== -1) {
      return new astFactory.LogicalExpression(
        tokens[logicalExpressionIndex].value,
        getExpression(tokens.slice(0, logicalExpressionIndex)),
        getExpression(tokens.slice(logicalExpressionIndex + 1))
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
        ((token.type === tokenTypes.ARITHMETIC_OPERATOR ||
          token.type === tokenTypes.COMPARISON_OPERATOR ||
          (token.type === tokenTypes.BITWISE_OPERATOR &&
            (token.value === '&' ||
              token.value === '|' ||
              token.value === '^'))) &&
          (nextToken.type === tokenTypes.NUMBER ||
            nextToken.type === tokenTypes.STRING ||
            nextToken.type === tokenTypes.BOOLEAN ||
            nextToken.type === tokenTypes.IDENTIFIER ||
            nextToken.type === tokenTypes.NULL ||
            nextToken.type === astTypes.BINARY_EXPRESSION ||
            nextToken.type === astTypes.LOGICAL_EXPRESSION))
          // maybe other
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
          if (
            binaryOperatorPrecedence[nextToken] >
            binaryOperatorPrecedence[currToken]
          ) {
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

    return new astFactory.BinaryExpression(
      tokens[operatorIndex].value,
      getExpression(tokens.slice(0, operatorIndex)),
      getExpression(tokens.slice(operatorIndex + 1))
    );
  }

  function getUnaryExpression(tokens) {
    const token = tokens[0];
    if (
      (token.type === tokenTypes.ARITHMETIC_OPERATOR &&
        (token.value === '-' || token.value === '+')) ||
      (token.type === tokenTypes.LOGICAL_OPERATOR && token.value === '!') ||
      (token.type === tokenTypes.LABEL && token.value === 'void') ||
      (token.type === tokenTypes.BITWISE_OPERATOR && token.value === '~')
    ) {
      return new astFactory.UnaryExpression(
        token.value,
        getLiteralOrIdentifier(tokens.slice(1))
      );
    }
    return null;
  }

  function getLiteralOrIdentifier(tokens) {
    if (tokens.length !== 1) {
      return null;
    }
    const token = tokens[0];
    if (token.type === tokenTypes.IDENTIFIER) {
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
      return new astFactory.Identifier(token.value);
    }
    throw new Error('Unexpected identifier token type: ' + token.type);
  }

  function getLiteral(tokens) {
    if (tokens.length !== 1) {
      throw new Error('Unexpected literal count');
    }
    const token = tokens[0];
    if (
      token.type === tokenTypes.NUMBER ||
      token.type === tokenTypes.STRING ||
      token.type === tokenTypes.BOOLEAN ||
      token.type === tokenTypes.NULL
    ) {
      return new astFactory.Literal(token.value);
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
      return new astFactory.SequenceExpression(sequenceExpressions);
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
      if (
        questionMarkIndex === -1 &&
        tokens[i].type === tokenTypes.CONDITIONAL_OPERATOR &&
        tokens[i].value === '?'
      ) {
        questionMarkIndex = i;
      }
      if (
        colonIndex === -1 &&
        tokens[i].type === tokenTypes.CONDITIONAL_OPERATOR &&
        tokens[i].value === ':'
      ) {
        colonIndex = i;
      }
    }
    if (questionMarkIndex === -1 || colonIndex === -1) {
      return null;
    }
    return new astFactory.ConditionalExpression(
      getExpression(tokens.slice(0, questionMarkIndex)),
      getExpression(tokens.slice(questionMarkIndex + 1, colonIndex)),
      getExpression(tokens.slice(colonIndex + 1))
    );
  }

  function getMemberExpression(tokens) {
    if (tokens.length < 3) {
      return null;
    }

    if (
      tokens[tokens.length - 1].type === tokenTypes.IDENTIFIER &&
      tokens[tokens.length - 2].type === tokenTypes.LABEL &&
      tokens[tokens.length - 2].value === '.'
    ) {
      return new astFactory.MemberExpression(
        getExpression(tokens.slice(0, -2)),
        getExpression(tokens.slice(-1))
      );
    }

    if (
      tokens[tokens.length - 1].type === tokenTypes.LABEL &&
      tokens[tokens.length - 1].value === ']'
    ) {
      // get [ index
      let startBracketIndex = -1;
      for (let i = tokens.length - 1; i >= 0; i--) {
        if (tokens[i].type === tokenTypes.LABEL && tokens[i].value === '[') {
          startBracketIndex = i;
          break;
        }
      }
      if (startBracketIndex === -1) {
        throw new Error('Expect [');
      }
      return new astFactory.MemberExpression(
        getExpression(tokens.slice(0, startBracketIndex)),
        getExpression(tokens.slice(startBracketIndex + 1, tokens.length - 1))
      );
    }

    return null;
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
    getGrouping(tokens);

    let start = 0;
    const end = tokens.length - 1;
    let statements = [];
    for (let i = start; i <= end; i++) {
      if (tokens[i].type === tokenTypes.LABEL && tokens[i].value === ';') {
        statements.push(
          new astFactory.ExpressionStatement(
            getExpression(tokens.slice(start, i))
          )
        );
        start = i + 1;
      }
    }
    if (tokens[end].type === tokenTypes.LABEL && tokens[end].value === ';') {
      statements.push(
        new astFactory.ExpressionStatement(
          getExpression(tokens.slice(start, end))
        )
      );
    } else {
      statements.push(
        new astFactory.ExpressionStatement(
          getExpression(tokens.slice(start, end + 1))
        )
      );
    }
    return statements;
  }
};
