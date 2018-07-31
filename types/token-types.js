/**
 * @since 20180730 15:44
 * @author vivaxy
 */

exports.tokenTypes = {
  ARITHMETIC_OPERATOR: 'arithmeticOperator', // +(二元), -(二元), /, *, %, **, ++, --, -(一元), +(一元)
  BITWISE_OPERATOR: 'bitwiseOperator', // &, |, ^, ~, <<, >>, >>>
  COMPARISON_OPERATOR: 'comparisonOperator', // ==, ===, >, <, <=, >=, !=, !==
  CONDITIONAL_OPERATOR: 'conditionalOperator', // ? :
  LOGICAL_OPERATOR: 'logicalOperator', // &&, ||, !
  NUMBER: 'number',
  STRING: 'string',
  BOOLEAN: 'boolean',
  PARENTHESIS: 'parenthesis',
  LABEL: 'label', // ; , . [ ]
  NULL: 'null',
  IDENTIFIER: 'identifier', // 变量, undefined
};
