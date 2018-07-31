/**
 * @since 20180730 14:52
 * @author vivaxy
 */

const astTypes = {
  PROGRAM: 'Program',
  EXPRESSION_STATEMENT: 'ExpressionStatement',
  LITERAL: 'Literal',
  BINARY_EXPRESSION: 'BinaryExpression',
  UNARY_EXPRESSION: 'UnaryExpression', // void + - !
  LOGICAL_EXPRESSION: 'LogicalExpression',
  IDENTIFIER: 'Identifier',
  SEQUENCE_EXPRESSION: 'SequenceExpression',
  CONDITIONAL_EXPRESSION: 'ConditionalExpression',
  MEMBER_EXPRESSION: 'MemberExpression',
};

exports.astTypes = astTypes;

exports.Position = class Position {
  constructor(line, column) {
    this.line = line;
    this.column = column;
  }
};

exports.Location = class Location {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }
};

class ASTNode {
  constructor(type, location) {
    this.type = type;
    // this.location = location;
  }
}

exports.ASTNode = ASTNode;

exports.Program = class Program extends ASTNode {
  constructor(body, location) {
    super(astTypes.PROGRAM, location);
    this.body = body;
  }
};

exports.ExpressionStatement = class ExpressionStatement extends ASTNode {
  constructor(expression, location) {
    super(astTypes.EXPRESSION_STATEMENT, location);
    this.expression = expression;
  }
};

exports.Literal = class Literal extends ASTNode {
  constructor(value, location) {
    super(astTypes.LITERAL, location);
    this.value = value;
  }
};

exports.BinaryExpression = class BinaryExpression extends ASTNode {
  constructor(operator, left, right, location) {
    super(astTypes.BINARY_EXPRESSION, location);
    this.operator = operator;
    this.left = left;
    this.right = right;
  }
};

exports.UnaryExpression = class UnaryExpression extends ASTNode {
  constructor(operator, argument, location) {
    super(astTypes.UNARY_EXPRESSION, location);
    this.operator = operator;
    this.argument = argument;
  }
};

exports.LogicalExpression = class LogicalExpression extends ASTNode {
  constructor(operator, left, right, location) {
    super(astTypes.LOGICAL_EXPRESSION, location);
    this.operator = operator;
    this.left = left;
    this.right = right;
  }
};

exports.Identifier = class Identifier extends ASTNode {
  constructor(name, location) {
    super(astTypes.IDENTIFIER, location);
    this.name = name;
  }
};

exports.SequenceExpression = class SequenceExpression extends ASTNode {
  constructor(expressions, location) {
    super(astTypes.SEQUENCE_EXPRESSION, location);
    this.expressions = expressions;
  }
};

exports.ConditionalExpression = class ConditionalExpression extends ASTNode {
  constructor(test, consequent, alternate, location) {
    super(astTypes.CONDITIONAL_EXPRESSION, location);
    this.test = test;
    this.consequent = consequent;
    this.alternate = alternate;
  }
};

exports.MemberExpression = class MemberExpression extends ASTNode {
  constructor(object, property, location) {
    super(astTypes.MEMBER_EXPRESSION, location);
    this.object = object;
    this.property = property;
  }
};