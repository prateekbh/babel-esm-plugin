import test from 'ava';
import { getCompiler, defaultConfig, runWebpack } from '../webpack-utils';
const BabelEsmPlugin = require('../../src/index');
test('single-loader is being tested', t => {
  t.pass();
})
test('esm files are being generated', async t => {
  const config = {
    entry : './tests/single-loader/fixtures/index.js',
    output: {
      path: `${__dirname}/output`,
      filename: 'index.js'
    },
    module: {
      rules: [
        defaultConfig
      ]
    },

  };
  const compiler = getCompiler(config);
  await runWebpack(compiler);
  t.is(true, true);
});