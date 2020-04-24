const deepcopy = require('deepcopy');
const chalk = require('chalk');
const BABEL_LOADER_NAME = 'babel-loader';
/**
 * Find all possible incarnations of preset-env:
 *   "env"
 *   "@babel/preset-env"
 *   "node_modules/@babel/preset-env"
 *   "node_modules/@babel/preset-env/index.js"
 */
const IS_PRESET_ENV = /((^|[\/\\])@babel[\/\\]preset-env([\/\\]|$)|^env$)/;

/**
 * Takes the current options and returns it with @babel/preset-env's target set to {"esmodules": true}.
 * @param {Object} options
 */
const makeESMPresetOptions = options => {
  let found = false;
  options = options || {};
  options.presets = (options.presets || []).filter(preset => {
    const name = Array.isArray(preset) ? preset[0] : preset;
    if (IS_PRESET_ENV.test(name) && preset[1]) {
      found = true;
      let presetOptions = preset[1];
      presetOptions.targets = presetOptions.targets || {};
      presetOptions.targets = { esmodules: true };
      presetOptions.bugfixes = true;
    }
    return true;
  });
  if (!found) {
    console.log(
      chalk.yellow('Adding @babel/preset-env because it was not found'),
    );
    options.presets.push([
      '@babel/preset-env',
      {
        targets: { esmodules: true },
        bugfixes: true,
      },
    ]);
  }
  return options;
};

/**
 * Returns a copy of current babel-loader config.
 * @param {Object} config
 */
const getBabelLoaderOptions = config => {
  return deepcopy(getBabelLoader(config).options);
};

/**
 * Returns a ref to babel-config
 * @param {Object} config
 */
const getBabelLoader = config => {
  let babelConfig = null;
  config.module.rules.forEach(rule => {
    if (!babelConfig) {
      if (rule.use && Array.isArray(rule.use)) {
        rule.use.forEach(rule => {
          if (rule.loader && rule.loader.includes(BABEL_LOADER_NAME)) {
            babelConfig = rule;
          }
        });
      } else if (
        (rule.use &&
          rule.use.loader &&
          rule.use.loader.includes(BABEL_LOADER_NAME)) ||
        (rule.loader && rule.loader.includes(BABEL_LOADER_NAME))
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
};

module.exports = {
  getBabelLoader,
  getBabelLoaderOptions,
  makeESMPresetOptions,
};
