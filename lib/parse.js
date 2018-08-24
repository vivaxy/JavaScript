/**
 * @since 20180822 15:08
 * @author vivaxy
 */

const astFactory = require('../types/ast-types.js');
const astTypes = astFactory.astTypes;

module.exports = function parse(input) {
  const codesString = 'aftzAZ09_$"\'.\\ \n\r\t()[]+-*/%&|!^~<>=?:,';
  let codes = {};
  codesString.split('').forEach((item) => {
    codes[item] = item.charCodeAt(0);
  });

  let rootNode = new astFactory.Program([]);
  let currentNode = rootNode;
  let i = 0;
  let operator = null;

  while (i < input.length) {
    let code = input.charCodeAt(i);

    if (isIdentifierStart(code)) {
      updateCurrentNode(new astFactory.Identifier(getIdentifier()));
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
      updateCurrentNode(new astFactory.Literal(Number(input.slice(start, i))));
      continue;
    }

    if (matchToken('true')) {
      i += 4;
      updateCurrentNode(new astFactory.Literal(true));
      continue;
    }

    if (matchToken('false')) {
      i += 5;
      updateCurrentNode(new astFactory.Literal(false));
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

      updateCurrentNode(new astFactory.Literal(input.slice(startIndex + 1, i)));
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

      updateCurrentNode(parse(input.slice(startIndex + 1, i)));
      continue;
    }

    if (code === codes['.']) {
      i++;
      updateCurrentNode(new astFactory.Identifier(getIdentifier()));
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

      updateCurrentNode(parse(input.slice(startIndex + 1, i)));
    }

    if (code === codes['+'] || code === codes['-']) {
      if (matchToken('++')) {
        operator = '++';
        i += 2;
        continue;
      }
      if (matchToken('--')) {
        operator = '--';
        i += 2;
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
    }

    throwError('Unexpected token: ' + String.fromCharCode(code));
  }

  return rootNode;

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
    return (code >= codes['0'] && code <= codes['9']) || code === codes['.'];
  }

  function isStringStart(code) {
    return code === codes['"'] || code === codes["'"];
  }

  function updateCurrentNode(newNode) {
    if (currentNode.type === astTypes.PROGRAM) {
      currentNode.body.push(newNode);
      return (currentNode = newNode);
    }
    throwError('Unexpected');
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
};
