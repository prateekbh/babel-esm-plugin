const deepcopy = require('deepcopy');
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');
const chalk = require('chalk');

const PLUGIN_NAME = 'BabelEsmPlugin';
const BABEL_LOADER_NAME = 'babel-loader';

class BabelEsmPlugin {
  apply(compiler) {

    compiler.hooks.make.tapAsync(PLUGIN_NAME, (compilation, callback) => {
      const outputOptions = deepcopy(compiler.options);
      this.babelLoaderConfigOptions_ = this.getBabelLoaderOptions(outputOptions);
      this.newConfigOptions_ = this.makeESMPresetOptions(this.babelLoaderConfigOptions_);
      outputOptions.output.filename = '[name].mjs';
      const childCompiler = compilation.createChildCompiler(PLUGIN_NAME, outputOptions.output);
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
        });
      });
      callback();
    });
  }

  /**
   * Returns a copy of current babel-loader config
   */
  getBabelLoaderOptions(config) {
    let babelConfig = null;
    config.module.rules.forEach(rule => {
      if (!babelConfig && ((rule.use || {}).loader === BABEL_LOADER_NAME || rule.loader === BABEL_LOADER_NAME)) {
        babelConfig = rule.use || rule;
      }
    });
    if(!babelConfig) {
      throw new Error('Babel-loader config not found!!!');
    }
    return deepcopy(babelConfig.options);
  }

  makeESMPresetOptions(options) {
    let found = false;
    options = options || {};
    options.presets = options.presets || [];
    options.presets.forEach(preset => {
      if (preset[0] === '@babel/preset-env') {
        found = true;
        preset[1].targets = preset[1].targets || {};
        preset[1].targets = {"esmodules": true};
      }
    });
    if (!found) {
      console.log(chalk.yellow('Adding @babel/preset-env because it was not found in babel-loader config'));
      options.presets.push(['@babel/preset-env', {targets: {"esmodules": true}}])
    }
    return options;
  }
}

module.exports = BabelEsmPlugin;