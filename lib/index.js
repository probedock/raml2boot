var _ = require('underscore'),
    autoprefixer = require('autoprefixer-core'),
    commander = require('commander'),
    fs = require('fs'),
    inflect = require('inflect-js'),
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

module.exports = {
  cli: function(argv) {
    argv = argv || process.argv;

    commander
      .version(pkg.version)
      .arguments('<source>')
      .option('-o, --output [file]', 'output file (defaults to the original file with the .raml extension replaced by .html)')
      .action(function(source) {
        doTheMagic(_.extend(_.pick(commander, 'output'), { source: source }));
      })
      .parse(argv);

    if (!argv.slice(2).length) {
      commander.outputHelp();
    }
  }
};

var root = path.join(__dirname, '..');

var assetDirs = [ 'css', 'js' ];

function doTheMagic(options) {
  if (!options.source.match(/\.raml$/)) {
    throw new Error('Source file name must end with ".raml"');
  }

  var outputFile = options.output ? options.output : options.source.replace(/\.raml$/, '.html');

  var ramlPromise = p.resolve(options.source).then(compileRaml),
      assetsPromise = p.resolve().then(loadAssets);

  return p.all([ ramlPromise, assetsPromise ]).spread(renderJade).then(function(result) {
    fs.writeFile(outputFile, result);
  });
}

function loadAssets() {

  var assets = {};

  return p.all(_.map(assetDirs, loadAssetsIn)).return(assets);

  function loadAssetsIn(dir) {
    return fs.readdirAsync(path.join(root, dir)).then(function(files) {
      return p.all(_.map(files, function(file) {

        var ext = path.extname(file).replace(/^\./, ''),
            filePath = path.join(root, dir, file);

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

function renderJade(raml, assets) {

  var file = path.join(root, 'templates', 'raml', 'template.jade');

  var devMode = false;

  var otherHelpers = {
    toggleStateClass: function() {
      return devMode ? 'in' : '';
    },
    isSchemaIndentBordered: true
  };

  var helpers = _.extend(jadeHelpers.helpers, otherHelpers);

  var options = _.extend(raml, { filename: file, helpers: helpers, parser: jadeParser });

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
