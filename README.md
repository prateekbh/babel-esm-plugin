# babel-esm-plugin
![Build Status](https://travis-ci.org/prateekbh/babel-esm-plugin.svg?branch=master)

Add this plugin to generate mirrored esm modules for your existing bundles. You may use these bundles in `module/nomodule` in your web-app and ship less transpiled code to your users.
Works with Webpack4 and Babel7

```
npm i -D babel-esm-plugin
```

### Note
This plugin only works when you're already using `babel-preset-env`.

Also, there is an expectation that your `babel-preset-env` is configured in the shape:
```
{
  use: {
    loader: 'babel-loader',
    options: {
      "presets": [["@babel/preset-env", {
        "targets": {
          "browsers": ["last 2 versions", "safari >= 7"]
        }
        ....
      }]]
    },
  },
}
```

## Options
```js
new BabelEsmPlugin({
  filename: '[name].es6.js',
  chunkFilename: '[id].es6.js',
  excludedPlugins: [...],
  additionalPlugins: [...],
  beforeStartExecution: function(plugins, babelConfig) {}
});
```
1. `filename`: Output name of es6 bundles. (default: '[name].es6.js')
2. `chunkFilename`: Output name of es6 chunks. (default: '[id].es6.js')
3. `excludedPlugins`: List of plugins you want to exclude from generating es6 bundles.
4. `additionalPlugins`: List of plugins you want to add while generating es6 bundles.
5. `beforeStartExecution`: A callback function which passes all plugins and the new babel config, to a function where the user can modify them before starting the `ESM` build.

## Without this plugin
A usual output from webpack output looks like this:
![ES5 output](https://raw.githubusercontent.com/prateekbh/babel-esm-plugin/master/images/es5-screenshot.png)

## With this plugin
With this plugin added, you will be generating es6 outputs:
![ES5 output](https://raw.githubusercontent.com/prateekbh/babel-esm-plugin/master/images/es6-screenshot.png)

## How to use
```js
  const BabelEsmPlugin = require('babel-esm-plugin');

  module.exports = {
    entry: {
      index: './index.js',
      home: './index2.js'
    },
    output: {
      filename: "[name].js"
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: 'babel-loader',
            options: {
              "presets": [["@babel/preset-env", {
                "targets": {
                  "browsers": ["last 2 versions", "safari >= 7"]
                }
              }]]
            },
          },
        }
      ]
    },
    plugins: [
      new BabelEsmPlugin()
    ]
  }
```
