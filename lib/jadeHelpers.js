var
  _ = require('underscore'),
  highlightLib = require('highlight.js'),
  marked = require('marked');

function highlight(code) {
  return code ? highlightLib.highlightAuto('' + code).value : '';
}

var markedConfig = {
  gfm: true,
  smartypants: true,
  highlight: highlight
};

marked.setOptions(markedConfig);

module.exports = {
  marked: markedConfig,
  helpers: {
    highlight: highlight,
    marked: function(content) {
      return content ? marked('' + content) : '';
    },
    isShortable: function(content) {
      return content && content.indexOf('.') > 0 && content.substr(content.indexOf('.') + 1).length > 0;
    },
    shorten: function(content) {
      if (content && content.indexOf('.') > 0) {
        var substr = content.substr(content.indexOf('.') + 1);

        if (substr.length > 0) {
          return content.substr(0, content.indexOf('.')) + '...';
        }
      }

      return content;
    },
    is: function(resource, method, target) {
      return _.contains(method.is, target) || _.contains(resource.is, target);
    },
    isSecuredBy: function(method, name, type) {
      if (method.securedBy) {
        var flag = false;

        _.each(method.securedBy, function(securedBy) {
          if (securedBy == name || securedBy[name]) {
            if (type != null && securedBy[name].type && securedBy[name].type == type) {
              flag = true;
            }
            else {
              flag = true;
            }
          }
        })
      }

      return flag;
    },
    contentLessShorten: function(content) {
      if (content && content.indexOf('.')) {
        return content.substr(content.indexOf('.') + 1);
      }
      else {
        return content;
      }
    }
  }
};
