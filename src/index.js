const deepcopy = require('deepcopy');
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');
const JsonpTemplatePlugin = require('webpack/lib/web/JsonpTemplatePlugin');
const SplitChunksPlugin = require('webpack/lib/optimize/SplitChunksPlugin');
const chalk = require('chalk');

const PLUGIN_NAME = 'BabelEsmPlugin';
const BABEL_LOADER_NAME = 'babel-loader';
const FILENAME = '[name].es6.js';
const CHUNK_FILENAME = '[id].es6.js';

class BabelEsmPlugin {
  constructor(options) {
    this.options_ = Object.assign({
      filename: FILENAME,
      chunkFilename: CHUNK_FILENAME,
      excludedPlugins: [PLUGIN_NAME],
      additionalPlugins: []
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
      let plugins = (compiler.options.plugins || []).filter(c => this.options_.excludedPlugins.indexOf(c.constructor.name) < 0);

      // Add the additionalPlugins
      plugins = plugins.concat(this.options_.additionalPlugins);

      // Compile to an in-memory filesystem since we just want the resulting bundled code as a string
      const childCompiler = compilation.createChildCompiler(PLUGIN_NAME, outputOptions.output, plugins);

      childCompiler.context = compiler.context;

      Object.keys(compiler.options.entry).forEach(entry => {
        childCompiler.apply(new SingleEntryPlugin(compiler.context, compiler.options.entry[entry], entry));
      });

      // Convert entry chunk to entry file
      childCompiler.apply(new JsonpTemplatePlugin());

      if (compiler.options.optimization) {
        if (compiler.options.optimization.splitChunks) {
          new SplitChunksPlugin(
            Object.assign(
              {},
              compiler.options.optimization.splitChunks,
            )
          ).apply(childCompiler);
        }
      }

      compilation.hooks.additionalAssets.tapAsync(PLUGIN_NAME, (childProcessDone) => {
        childCompiler.options.module.rules.forEach((rule, index) => {
          this.getBabelLoader(childCompiler.options).options = this.newConfigOptions_;
        });

        this.options_.beforeStartExecution && this.options_.beforeStartExecution(plugins);

        childCompiler.runAsChild((err, entries, childCompilation) => {
          if (!err) {
            compilation.assets = Object.assign(childCompilation.assets,
              compilation.assets
            );
            compilation.namedChunkGroups = Object.assign(
              childCompilation.namedChunkGroups,
              compilation.namedChunkGroups
            );
          }
          err && compilation.errors.push(err);
          childProcessDone();
        });
      });
      callback();
    });
  }

  /**
   * Returns a ref to babel-config
   * @param {Object} config
   */
  getBabelLoader(config) {
    let babelConfig = null;
    config.module.rules.forEach(rule => {
      if (!babelConfig) {
        if (rule.use && Array.isArray(rule.use)) {
          rule.use.forEach(rule => {
            if (rule.loader === BABEL_LOADER_NAME) {
              babelConfig = rule;
            }
          });
        } else if ((rule.use && rule.use.loader && rule.use.loader === BABEL_LOADER_NAME) || rule.loader === BABEL_LOADER_NAME) {
          babelConfig = rule.use || rule;
        }
      }
    });
    if (!babelConfig) {
      throw new Error('Babel-loader config not found!!!');
    } else {
      return babelConfig;
    }
  }

  /**
   * Returns a copy of current babel-loader config.
   * @param {Object} config
   */
  getBabelLoaderOptions(config) {
    return deepcopy(this.getBabelLoader(config).options);
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
      if (preset[0].indexOf('@babel/preset-env') > -1) {
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
