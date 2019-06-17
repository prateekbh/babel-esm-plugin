const deepcopy = require('deepcopy');
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');
const MultiEntryPlugin = require('webpack/lib/MultiEntryPlugin');
const JsonpTemplatePlugin = require('webpack/lib/web/JsonpTemplatePlugin');
const SplitChunksPlugin = require('webpack/lib/optimize/SplitChunksPlugin');
const RuntimeChunkPlugin = require('webpack/lib/optimize/RuntimeChunkPlugin');
const chalk = require('chalk');

const PLUGIN_NAME = 'BabelEsmPlugin';
const BABEL_LOADER_NAME = 'babel-loader';
const FILENAME = '[name].es6.js';
const CHUNK_FILENAME = '[id].es6.js';

class BabelEsmPlugin {
  constructor(options) {
    this.options_ = Object.assign(
      {
        filename: FILENAME,
        chunkFilename: CHUNK_FILENAME,
        excludedPlugins: [PLUGIN_NAME],
        additionalPlugins: [],
      },
      options,
    );
  }

  apply(compiler) {
    compiler.hooks.make.tapAsync(PLUGIN_NAME, async (compilation, callback) => {
      const outputOptions = deepcopy(compiler.options);
      this.babelLoaderConfigOptions_ = this.getBabelLoaderOptions(
        outputOptions,
      );
      this.newConfigOptions_ = this.makeESMPresetOptions(
        this.babelLoaderConfigOptions_,
      );
      outputOptions.output.filename = this.options_.filename;
      outputOptions.output.chunkFilename = this.options_.chunkFilename;
      // Only copy over mini-extract-text-plugin (excluding it breaks extraction entirely)
      let plugins = (compiler.options.plugins || []).filter(
        c => this.options_.excludedPlugins.indexOf(c.constructor.name) < 0,
      );

      // Add the additionalPlugins
      plugins = plugins.concat(this.options_.additionalPlugins);

      /**
       * We are deliberatly not passing plugins in createChildCompiler.
       * All webpack does with plugins is to call `apply` method on them
       * with the childCompiler.
       * But by then we haven't given childCompiler a fileSystem or other options
       * which a few plugins might expect while execution the apply method.
       * We do call the `apply` method of all plugins by ourselves later in the code
       */
      const childCompiler = compilation.createChildCompiler(
        PLUGIN_NAME,
        outputOptions.output,
      );

      childCompiler.context = compiler.context;
      childCompiler.inputFileSystem = compiler.inputFileSystem;
      childCompiler.outputFileSystem = compiler.outputFileSystem;

      // Call the `apply` method of all plugins by ourselves.
      if (Array.isArray(plugins)) {
        for (const plugin of plugins) {
          plugin.apply(childCompiler);
        }
      }

      let entries = compiler.options.entry;
      if (typeof entries === 'function') {
        entries = await entries();
      }
      if (typeof entries === 'string') {
        entries = {
          index: entries,
        };
      }

      Object.keys(entries).forEach(entry => {
        const entryFiles = entries[entry];
        if (Array.isArray(entryFiles)) {
          new MultiEntryPlugin(compiler.context, entryFiles, entry).apply(
            childCompiler,
          );
        } else {
          new SingleEntryPlugin(compiler.context, entryFiles, entry).apply(
            childCompiler,
          );
        }
      });

      // Convert entry chunk to entry file
      new JsonpTemplatePlugin().apply(childCompiler);

      if (compiler.options.optimization) {
        if (compiler.options.optimization.splitChunks) {
          new SplitChunksPlugin(
            Object.assign({}, compiler.options.optimization.splitChunks),
          ).apply(childCompiler);
        }
        if (compiler.options.optimization.runtimeChunk) {
          new RuntimeChunkPlugin(
            Object.assign({}, compiler.options.optimization.runtimeChunk),
          ).apply(childCompiler);
        }
      }

      compilation.hooks.additionalAssets.tapAsync(
        PLUGIN_NAME,
        childProcessDone => {
          let babelLoader;
          childCompiler.options.module.rules.forEach((rule, index) => {
            babelLoader = this.getBabelLoader(childCompiler.options);
            babelLoader.options = this.newConfigOptions_;
          });

          this.options_.beforeStartExecution &&
            this.options_.beforeStartExecution(
              plugins,
              (babelLoader || {}).options,
            );

          childCompiler.runAsChild((err, entries, childCompilation) => {
            if (!err) {
              compilation.assets = Object.assign(
                childCompilation.assets,
                compilation.assets,
              );
              compilation.namedChunkGroups = Object.assign(
                childCompilation.namedChunkGroups,
                compilation.namedChunkGroups,
              );
            }
            err && compilation.errors.push(err);
            childProcessDone();
          });
        },
      );
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
            if (rule.loader.includes(BABEL_LOADER_NAME)) {
              babelConfig = rule;
            }
          });
        } else if (
          (rule.use &&
            rule.use.loader &&
            rule.use.loader.includes(BABEL_LOADER_NAME)) ||
          rule.loader.includes(BABEL_LOADER_NAME)
        ) {
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
      if (!Array.isArray(preset)) return;
      const [name, options] = preset;
      if (
        name.includes('@babel/preset-env') ||
        name.includes('@babel\\preset-env')
      ) {
        found = true;
        options.targets = options.targets || {};
        options.targets = { esmodules: true };
      }
    });
    if (!found) {
      console.log(
        chalk.yellow('Adding @babel/preset-env because it was not found'),
      );
      options.presets.push([
        '@babel/preset-env',
        { targets: { esmodules: true } },
      ]);
    }
    return options;
  }
}

module.exports = BabelEsmPlugin;
