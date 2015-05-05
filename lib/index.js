var _ = require('underscore'),
    autoprefixer = require('autoprefixer-core'),
    commander = require('commander'),
    fs = require('fs-extra'),
    jade = require('jade'),
    jadeHelpers = require('./jadeHelpers'),
    jadeParser = require('./jadeParser'),
    p = require('bluebird'),
    path = require('path'),
    pkg = require('../package'),
    raml2obj = require('raml2obj'),
    stylus = require('stylus');

p.promisifyAll(fs);
p.promisifyAll(stylus);

module.exports = doTheMagic;

module.exports.cli = function(argv) {
  argv = argv || process.argv;

  commander
    .version(pkg.version)
    .arguments('<source>')
    .option('-o, --output [file]', 'output file; if not given, the result will simply be printed to standard output')
    .option('-s, --standalone [boolean]', 'whether the output file should be a standalone HTML file with a navbar and title (set to true), or only a partial file to include in another layout (set to false); defaults to true (has no effect with the --layout option)')
    .option('-l, --layout [file]', 'use a custom Jade layout file')
    .action(function(source) {

      var options = _.extend({
        source: source
      }, _.pick(commander, 'output', 'layout'));

      if (commander.standalone) {
        options.standalone = commander.standalone.match(/^(?:1|y|yes|t|true)$/)
      }

      doTheMagic(options);
    })
    .parse(argv);

  if (!argv.slice(2).length) {
    commander.outputHelp();
  }
};

var root = path.join(__dirname, '..');

var assetDirs = [ 'css', 'js' ];

function doTheMagic(options) {
  if (!options.source.match(/\.raml$/)) {
    throw new Error('Source file name must end with ".raml"');
  }

  if (options.standalone === undefined) {
    options.standalone = true;
  }

  var outputFile = options.output;

  var ramlPromise = p.resolve(options.source).then(compileRaml),
      assetsPromise = p.resolve().then(loadAssets),
      optionsPromise = p.resolve(options);;

  return p.all([ ramlPromise, assetsPromise, optionsPromise ]).spread(renderJade).then(function(result) {
    if (outputFile) {
      return saveResult(result);
    }

    console.log(result);
  });

  function saveResult(result) {
    return fs.mkdirsAsync(path.dirname(outputFile)).then(function() {
      return fs.writeFileAsync(outputFile, result);
    });
  }
}

function loadAssets() {

  var assets = {};

  return p.all(_.map(assetDirs, loadAssetsIn)).return(assets);

  function loadAssetsIn(dir) {
    return fs.readdirAsync(path.join(root, 'templates', dir)).then(function(files) {
      return p.all(_.map(files, function(file) {

        var ext = path.extname(file).replace(/^\./, ''),
            filePath = path.join(root, 'templates', dir, file);

        var promise = parsers[ext] ? parsers[ext](filePath) : p.resolve(fs.readFileSync(filePath, { encoding: 'utf-8' }));
        return promise.then(function(contents) {
          assets[dir] = assets[dir] || {};
          assets[dir][path.basename(file).replace(/\..*/, '')] = contents;
        });
      }));
    });
  }
}

var parsers = {
  styl: function(file) {
    return stylus.renderAsync(fs.readFileSync(file, { encoding: 'utf-8' }), { filename: file }).then(function(css) {
      return autoprefixer.process(css).css;
    });
  }
};

function renderJade(raml, assets, options) {

  var file = path.join(root, 'templates', 'api.jade'),
      layoutFile = options.layout || path.join(root, 'templates', options.standalone ? 'standalone.jade' : 'partial.jade');

  var devMode = false;

  var otherHelpers = {
    toggleStateClass: function() {
      return devMode ? 'in' : '';
    },
    isSchemaIndentBordered: true
  };

  var helpers = _.extend(jadeHelpers.helpers, otherHelpers);

  var options = _.extend(raml, { filename: file, helpers: helpers, parser: jadeParser(layoutFile), livereload: options.livereload });

  _.each(assetDirs, function(dir) {
    options[dir] = function(name) {
      if (!assets[dir][name]) {
        throw new Error('Unknown ' + dir + ' asset ' + name);
      }

      return assets[dir][name];
    };
  });

  return jade.renderFile(file, options);
}

function compileRaml(sourceFile) {
  return raml2obj.parse(fs.readFileSync(sourceFile, { encoding: 'utf-8' }));
}
