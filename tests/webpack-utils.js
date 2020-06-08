const webpack = require('webpack');
const BabelEsmPlugin = require('../src/index');

const defaultConfig = {
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: {
                    browsers: ['last 2 versions'],
                  },
                },
              ],
            ],
          },
        },
      },
    ],
  },
  plugins: [new BabelEsmPlugin({})],
  optimization: {
    minimize: false,
  },
};

const getCompiler = config => {
  return webpack(config);
};

const runWebpack = async compiler => {
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err || (stats && stats.hasErrors())) {
        reject(err);
      }
      resolve(stats);
    });
  });
};

module.exports = {
  defaultConfig,
  getCompiler,
  runWebpack,
};
