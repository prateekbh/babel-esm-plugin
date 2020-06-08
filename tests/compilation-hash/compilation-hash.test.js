import test from 'ava';
import { getCompiler, defaultConfig, runWebpack } from '../webpack-utils';
import * as fs from 'fs';
import { promisify } from 'util';
const BabelEsmPlugin = require('../../src/index');

const readFile = promisify(fs.readFile);

test('compilation-hash is being tested', t => {
  t.pass();
});
test('esm files are being generated', async t => {
  const config = Object.assign({}, defaultConfig, {
    entry: './tests/compilation-hash/fixtures/index.js',
    output: {
      path: `${__dirname}/output`,
      filename: 'index.[hash].js',
    },
    plugins: [
      new BabelEsmPlugin({
        filename: '[name].[hash].es6.js',
      }),
    ],
  });
  const compiler = getCompiler(config);
  const { hash } = await runWebpack(compiler);
  const files = fs.readdirSync(`${__dirname}/output/`);
  t.is(files.length, 4);
  t.deepEqual(files, [
    `index.${hash}.es6.js`,
    `index.${hash}.es6.js.map`,
    `index.${hash}.js`,
    `index.${hash}.js.map`,
  ]);
});
