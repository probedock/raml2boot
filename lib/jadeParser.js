var Parser = require('jade').Parser;

module.exports = function(layoutPath) {

  function CustomParser() {
    Parser.apply(this, arguments);
  }

  CustomParser.prototype.__proto__ = Parser.prototype;

  CustomParser.prototype.resolvePath = function(path, purpose) {

    if (path == 'raml2boot-layout') {
      return layoutPath;
    }

    return Parser.prototype.resolvePath.apply(this, arguments);
  };

  return CustomParser;
};
