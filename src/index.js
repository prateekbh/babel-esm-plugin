const deepcopy = require('deepcopy');
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');
const chalk = require('chalk');

const PLUGIN_NAME = 'BabelEsmPlugin';
const BABEL_LOADER_NAME = 'babel-loader';
const FILENAME = '[name].es6.js';
const CHUNK_FILENAME = '[id].es6.js';

class BabelEsmPlugin {
  constructor(options) {
    this.options_ = Object.assign({
      filename: FILENAME,
      chunkFilename: CHUNK_FILENAME
    }, options);
  }

  apply(compiler) {
    compiler.hooks.make.tapAsync(PLUGIN_NAME, (compilation, callback) => {
      const outputOptions = deepcopy(compiler.options);
      this.babelLoaderConfigOptions_ = this.getBabelLoaderOptions(outputOptions);
      this.newConfigOptions_ = this.makeESMPresetOptions(this.babelLoaderConfigOptions_);
      outputOptions.output.filename = this.options_.filename;
      outputOptions.output.chunkFilename = this.options_.chunkFilename;
      // Only copy over mini-extract-text-plugin (excluding it breaks extraction entirely)
      const plugins = (compiler.options.plugins || []).filter(c => /MiniCssExtractPlugin/i.test(c.constructor.name));
      
      // Compile to an in-memory filesystem since we just want the resulting bundled code as a string
      const childCompiler = compilation.createChildCompiler(PLUGIN_NAME, outputOptions.output, plugins);
      
      childCompiler.context = compiler.context;
      Object.keys(compiler.options.entry).forEach(entry => {
        childCompiler.apply(new SingleEntryPlugin(compiler.context, compiler.options.entry[entry], entry));
      });
      compilation.hooks.seal.tap(PLUGIN_NAME, () => {
        childCompiler.options.module.rules.forEach((rule, index) => {
          if ((rule.use || {}).loader === BABEL_LOADER_NAME || rule.loader === BABEL_LOADER_NAME) {
            const babelOptions = rule.use || rule;
            babelOptions.options = this.newConfigOptions_;
          }
        });
        childCompiler.runAsChild((err, entries, childCompilation) => {
          err && childCompiler.parentCompilation.errors.push(err);
        });
      });
      callback();
    });
  }

  /**
   * Returns a copy of current babel-loader config.
   * @param {Object} config
   */
  getBabelLoaderOptions(config) {
    let babelConfig = null;
    config.module.rules.forEach(rule => {
      if (!babelConfig && ((rule.use || {}).loader === BABEL_LOADER_NAME || rule.loader === BABEL_LOADER_NAME)) {
        babelConfig = rule.use || rule;
      }
    });
    if (!babelConfig) {
      throw new Error('Babel-loader config not found!!!');
    }
    return deepcopy(babelConfig.options);
  }

  /**
   * Takes the current options and returns it with @babel/preset-env's target set to {"esmodules": true}.
   * @param {Object} options
   */
  makeESMPresetOptions(options) {
    let found = false;
    options = options || {};
    options.presets = options.presets || [];
    options.presets.forEach(preset => {
      if (preset[0] === '@babel/preset-env') {
        found = true;
        preset[1].targets = preset[1].targets || {};
        preset[1].targets = { "esmodules": true };
      }
    });
    if (!found) {
      console.log(chalk.yellow('Adding @babel/preset-env because it was not found'));
      options.presets.push(['@babel/preset-env', { targets: { "esmodules": true } }])
    }
    return options;
  }
}

module.exports = BabelEsmPlugin;
