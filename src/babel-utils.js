const deepcopy = require('deepcopy');
const chalk = require('chalk');
const BABEL_LOADER_NAME = 'babel-loader';

/**
 * Takes the current options and returns it with @babel/preset-env's target set to {"esmodules": true}.
 * @param {Object} options
 */
const makeESMPresetOptions = options => {
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
          if (rule.loader.includes(BABEL_LOADER_NAME)) {
            babelConfig = rule;
          }
        });
      } else if (
        (rule.use &&
          rule.use.loader &&
          rule.use.loader.includes(BABEL_LOADER_NAME)) ||
        rule.loader && rule.loader.includes(BABEL_LOADER_NAME)
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
