# babel-esm-plugin
Add this plugin to generate mirrored esm modules for your existing bundles. You may use these bundles in `module/nomodule` in your web-app and ship less transpiled code to your users.

```
npm i -D babel-esm-plugin
```

## Without this plugin
A usual output from webpack output looks like this:
![ES5 output](https://raw.githubusercontent.com/prateekbh/babel-esm-plugin/master/images/es5-screenshot.png)

## With this plugin
With this plugin added, you will be generating es6 outputs:
![ES5 output](https://raw.githubusercontent.com/prateekbh/babel-esm-plugin/master/images/es6-screenshot.png)

## How to use
```js
  const BabelEsmPlugin = require('./babel-esm-plugin');

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
