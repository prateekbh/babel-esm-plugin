const deepcopy = require('deepcopy');
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');

const PLUGIN_NAME = 'MyPlugin';
const BABEL_LOADER_NAME = 'babel-loader';

class MyPlugin {
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
		return deepcopy(babelConfig.options);
	}

	makeESMPresetOptions(options) {
		options.presets.forEach(preset => {
			if (preset[0] === '@babel/preset-env') {
				preset[1].targets = preset[1].targets || {};
				preset[1].targets = {"esmodules": true};
			}
		});
		return options;
	}
}

module.exports = MyPlugin;