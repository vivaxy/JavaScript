/**
 * @since 20180731 11:03
 * @author vivaxy
 */

const { tokenTypes } = require('../types/token-types.js');

module.exports = function tokenizer(input) {
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
    if (char === ',' || char === ';' || char === '[' || char === ']') {
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
      const breakChars = [';', '+', '-', '*', '/', '<', '>', '=', '(', ')', '%', '&', '|', '^', '~', '!', '?', ':', ',', '.', ' ', '[', ']'];
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
};
