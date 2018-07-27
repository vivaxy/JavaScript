/**
 * @since 20180503 11:42
 * @author vivaxy
 */

const test = require('ava');
const compiler = require('../index.js');
const tokenTypes = compiler.tokenTypes;
const astTypes = compiler.astTypes;
const tokenizer = compiler.tokenizer;
const parser = compiler.parser;
const execute = compiler.execute;
const stringify = compiler.stringify;

test('tokenizer', (t) => {
  t.deepEqual(tokenizer('{{userGrade}} == 0'), [
    {
      type: tokenTypes.IDENTIFIER,
      value: 'userGrade',
    },
    {
      type: tokenTypes.COMPARISON_OPERATOR,
      value: '==',
    },
    {
      type: tokenTypes.NUMBER,
      value: 0,
    },
  ]);

  t.deepEqual(tokenizer('"test"===\'value\''), [
    {
      type: tokenTypes.STRING,
      value: 'test',
    },
    {
      type: tokenTypes.COMPARISON_OPERATOR,
      value: '===',
    },
    {
      type: tokenTypes.STRING,
      value: 'value',
    },
  ]);
});

test('parser', (t) => {
  t.deepEqual(parser(tokenizer('1 === 2')), {
    type: astTypes.PROGRAM,
    body: [
      {
        type: astTypes.EXPRESSION_STATEMENT,
        expression: {
          type: astTypes.BINARY_EXPRESSION,
          operator: '===',
          left: {
            type: astTypes.LITERAL,
            value: 1,
          },
          right: {
            type: astTypes.LITERAL,
            value: 2,
          },
        },
      },
    ],
  });
  t.deepEqual(parser(tokenizer('1 === 2 && 3 == 4')), {
    type: astTypes.PROGRAM,
    body: [
      {
        type: astTypes.EXPRESSION_STATEMENT,
        expression: {
          type: astTypes.LOGICAL_EXPRESSION,
          operator: '&&',
          left: {
            type: astTypes.BINARY_EXPRESSION,
            operator: '===',
            left: {
              type: astTypes.LITERAL,
              value: 1,
            },
            right: {
              type: astTypes.LITERAL,
              value: 2,
            },
          },
          right: {
            type: astTypes.BINARY_EXPRESSION,
            operator: '==',
            left: {
              type: astTypes.LITERAL,
              value: 3,
            },
            right: {
              type: astTypes.LITERAL,
              value: 4,
            },
          },
        },
      },
    ],
  });
  t.deepEqual(parser(tokenizer('1 === 2 && (3 == 4)')), {
    type: astTypes.PROGRAM,
    body: [
      {
        type: astTypes.EXPRESSION_STATEMENT,
        expression: {
          type: astTypes.LOGICAL_EXPRESSION,
          operator: '&&',
          left: {
            type: astTypes.BINARY_EXPRESSION,
            operator: '===',
            left: {
              type: astTypes.LITERAL,
              value: 1,
            },
            right: {
              type: astTypes.LITERAL,
              value: 2,
            },
          },
          right: {
            type: astTypes.BINARY_EXPRESSION,
            operator: '==',
            left: {
              type: astTypes.LITERAL,
              value: 3,
            },
            right: {
              type: astTypes.LITERAL,
              value: 4,
            },
          },
        },
      },
    ],
  });

});

test('execute', (t) => {
  // operators
  t.deepEqual(compiler('-1'), -1);
  t.deepEqual(compiler('+1'), 1);
  t.deepEqual(compiler('!1'), false);
  t.deepEqual(compiler('11 >>> 1'), 5);
  t.deepEqual(compiler('11 >> 1'), 5);
  t.deepEqual(compiler('2 << 1'), 4);
  t.deepEqual(compiler('~1'), -2);
  t.deepEqual(compiler('5 || 2'), 5);
  t.deepEqual(compiler('5 && 2'), 2);
  t.deepEqual(compiler('5 !== 2'), true);
  t.deepEqual(compiler('5 != 2'), true);
  t.deepEqual(compiler('5 <= 2'), false);
  t.deepEqual(compiler('5 >= 2'), true);
  t.deepEqual(compiler('5 < 2'), false);
  t.deepEqual(compiler('5 > 2'), true);
  t.deepEqual(compiler('5 === 2'), false);
  t.deepEqual(compiler('5 == 2'), false);
  t.deepEqual(compiler('5 ** 2'), 25);
  t.deepEqual(compiler('5 % 2'), 1);
  t.deepEqual(compiler('4 * 2'), 8);
  t.deepEqual(compiler('4 / 2'), 2);
  t.deepEqual(compiler('1 - 2'), -1);
  t.deepEqual(compiler('1 + 2'), 3);
  t.deepEqual(compiler('1 ^ 2'), 3);
  t.deepEqual(compiler('1 | 2'), 3);
  t.deepEqual(compiler('1 & 2'), 0);
  t.deepEqual(compiler('1 === 1 ? 2 : 3'), 2);

  t.deepEqual(compiler('(1 + 1) * ((2))'), 4);
  t.deepEqual(compiler('(1 + 1) * (2)'), 4);
  t.deepEqual(compiler('(1 + 1) * 2'), 4);
  t.deepEqual(compiler('void 0'), undefined);
  t.deepEqual(compiler('void(0)'), undefined);
  t.deepEqual(compiler('1, 2 === 1'), false);
  t.deepEqual(compiler('1, 2'), 2);
  t.deepEqual(compiler('true || true && false'), true);
  t.deepEqual(compiler('false && true || false && true'), false);
  t.deepEqual(compiler('true && false || !true'), false);
  t.deepEqual(compiler('undefined === undefined'), true);
  t.deepEqual(compiler('undefined === {{test}}', { test: undefined }), true);
  t.deepEqual(compiler('1 === undefined'), false);
  t.deepEqual(compiler('null === undefined'), false);
  t.deepEqual(compiler('null === null'), true);
  t.deepEqual(compiler('1 === -1 && (1 === 1)'), false);
  t.deepEqual(compiler('-1 === -1'), true);
  t.deepEqual(compiler('1.1 === 1.1'), true);
  t.deepEqual(compiler('1 === 1 && 1 === 2'), false);
  t.deepEqual(compiler('{{userGrade}} > 1', { userGrade: 1 }), false);
  t.deepEqual(compiler('{{userGrade}} >= 1', { userGrade: 1 }), true);
  t.deepEqual(compiler('{{userGrade}} >= 1 && {{userName}} === \'test\'', {
    userGrade: 1,
    userName: 'test',
  }), true);
});

test('member expression', (t) => {
  t.deepEqual(tokenizer('"note-" + item.noteId'), [
    {
      type: tokenTypes.STRING,
      value: 'note-',
    },
    {
      type: tokenTypes.ARITHMETIC_OPERATOR,
      value: '+',
    },
    {
      type: tokenTypes.IDENTIFIER,
      value: 'item',
    },
    {
      type: tokenTypes.LABEL,
      value: '.',
    },
    {
      type: tokenTypes.IDENTIFIER,
      value: 'noteId',
    },
  ]);

  t.deepEqual(parser(tokenizer('"note-" + item.noteId')), {
    type: astTypes.PROGRAM,
    body: [
      {
        type: astTypes.EXPRESSION_STATEMENT,
        expression: {
          type: astTypes.BINARY_EXPRESSION,
          operator: '+',
          left: {
            type: astTypes.LITERAL,
            value: 'note-',
          },
          right: {
            type: astTypes.MEMBER_EXPRESSION,
            object: {
              type: astTypes.IDENTIFIER,
              name: 'item',
            },
            property: {
              type: astTypes.IDENTIFIER,
              name: 'noteId',
            },
          },
        },
      },
    ],
  });
});

test('parenthesis test', (t) => {

  t.deepEqual(parser(tokenizer('1 * (2 + (3 - 3) + 2) - 1')), {
    type: astTypes.PROGRAM,
    body: [
      {
        type: astTypes.EXPRESSION_STATEMENT,
        expression: {
          type: astTypes.BINARY_EXPRESSION,
          operator: '-',
          left: {
            type: astTypes.BINARY_EXPRESSION,
            operator: '*',
            left: {
              type: astTypes.LITERAL,
              value: 1,
            },
            right: {
              type: astTypes.BINARY_EXPRESSION,
              operator: '+',
              left: {
                type: astTypes.BINARY_EXPRESSION,
                operator: '+',
                left: {
                  type: astTypes.LITERAL,
                  value: 2,
                },
                right: {
                  type: astTypes.BINARY_EXPRESSION,
                  operator: '-',
                  left: {
                    type: astTypes.LITERAL,
                    value: 3,
                  },
                  right: {
                    type: astTypes.LITERAL,
                    value: 3,
                  },
                },
              },
              right: {
                type: astTypes.LITERAL,
                value: 2,
              }
            },
          },
          right: {
            type: astTypes.LITERAL,
            value: 1,
          },
        },
      },
    ],
  });

});

test('Use case', (t) => {

  t.deepEqual(parser(tokenizer(`'width:'+ (starNoteShowMediaInfo[index].width || '100%') + ';height:' +  (starNoteShowMediaInfo[index].height || '100%') + ';left:' + (starNoteShowMediaInfo[index].left || '0') + ';top:' + (starNoteShowMediaInfo[index].top || '0') + ';'`)), {
    type: astTypes.PROGRAM,
    body: [
      {
        type: astTypes.EXPRESSION_STATEMENT,
        expression: {
          type: astTypes.BINARY_EXPRESSION,
          operator: '+',
          left: {
            type: astTypes.BINARY_EXPRESSION,
            operator: '+',
            left: {
              type: astTypes.BINARY_EXPRESSION,
              operator: '+',
              left: {
                type: astTypes.BINARY_EXPRESSION,
                operator: '+',
                left: {
                  type: astTypes.BINARY_EXPRESSION,
                  operator: '+',
                  left: {
                    type: astTypes.BINARY_EXPRESSION,
                    operator: '+',
                    left: {
                      type: astTypes.BINARY_EXPRESSION,
                      operator: '+',
                      left: {
                        type: astTypes.BINARY_EXPRESSION,
                        operator: '+',
                        left: {
                          type: astTypes.LITERAL,
                          value: 'width:'
                        },
                        right: {
                          type: astTypes.LOGICAL_EXPRESSION,
                          operator: '||',
                          left: {
                            type: astTypes.MEMBER_EXPRESSION,
                            object: {
                              type: astTypes.IDENTIFIER,
                              name: 'starNoteShowMediaInfo[index]'
                            },
                            property: {
                              type: astTypes.IDENTIFIER,
                              name: 'width '
                            }
                          },
                          right: {
                            type: astTypes.LITERAL,
                            value: '100%'
                          }
                        }
                      },
                      right: {
                        type: astTypes.LITERAL,
                        value: ';height:'
                      }
                    },
                    right: {
                      type: astTypes.LOGICAL_EXPRESSION,
                      operator: '||',
                      left: {
                        type: astTypes.MEMBER_EXPRESSION,
                        object: {
                          type: astTypes.IDENTIFIER,
                          name: 'starNoteShowMediaInfo[index]'
                        },
                        property: {
                          type: astTypes.IDENTIFIER,
                          name: 'height '
                        }
                      },
                      right: {
                        type: astTypes.LITERAL,
                        value: '100%'
                      }
                    }
                  },
                  right: {
                    type: astTypes.LITERAL,
                    value: ';left:'
                  }
                },
                right: {
                  type: astTypes.LOGICAL_EXPRESSION,
                  operator: '||',
                  left: {
                    type: astTypes.MEMBER_EXPRESSION,
                    object: {
                      type: astTypes.IDENTIFIER,
                      name: 'starNoteShowMediaInfo[index]'
                    },
                    property: {
                      type: astTypes.IDENTIFIER,
                      name: 'left '
                    }
                  },
                  right: {
                    type: astTypes.LITERAL,
                    value: '0'
                  }
                }
              },
              right: {
                type: astTypes.LITERAL,
                value: ';top:'
              }
            },
            right: {
              type: astTypes.LOGICAL_EXPRESSION,
              operator: '||',
              left: {
                type: astTypes.MEMBER_EXPRESSION,
                object: {
                  type: astTypes.IDENTIFIER,
                  name: 'starNoteShowMediaInfo[index]'
                },
                property: {
                  type: astTypes.IDENTIFIER,
                  name: 'top '
                }
              },
              right: {
                type: astTypes.LITERAL,
                value: '0'
              }
            }
          },
          right: {
            type: astTypes.LITERAL,
            value: ';'
          }
        }
      }
    ]
  });
});

test.only('stringify', (t) => {
  t.is(stringify(parser(tokenizer('1 * (2 + (3 - 3) + 2) - 1'))), '((1 * ((2 + (3 - 3)) + 2)) - 1)');
});
