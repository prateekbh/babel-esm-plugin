const webpack = require('webpack');
const BabelEsmPlugin = require('../../src/index');

module.exports = {
  entry: './tests/compilation-hash/fixtures/index.js',
  output: {
    path: `${__dirname}/output`,
    filename: 'index.[hash].js',
  },
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
  plugins: [
    new BabelEsmPlugin({
      filename: '[name].[hash].es6.js',
    }),
  ],
  optimization: {
    minimize: false,
  },
};
