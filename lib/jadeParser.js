var Parser = require('jade').Parser;

function CustomParser() {
  Parser.apply(this, arguments);
}

CustomParser.prototype.__proto__ = Parser.prototype;

CustomParser.prototype.resolvePath = function(path, purpose) {
  var _super = Parser.prototype.resolvePath;
  return _super.apply(this, arguments);
};

module.exports = CustomParser;
