import test from 'ava';
import { getCompiler, defaultConfig, runWebpack } from '../webpack-utils';
import * as fs from 'fs';
import {promisify} from 'util';

const readFile = promisify(fs.readFile);

test('require-resolve is being tested', t => {
  t.pass();
})
test('esm files are being generated', async t => {
  const config = Object.assign({}, defaultConfig, {
    entry : {
      index: './tests/require-resolve/fixtures/index.js'
    },
    output: {
      path: `${__dirname}/output`,
      filename: 'index.js',
    }
  });
  config.module.rules[0].use.loader = require.resolve('babel-loader');
  const compiler = getCompiler(config);
  await runWebpack(compiler);
  const es5FixtureFileContents = await readFile(`${__dirname}/fixtures/output.js`, {
    encoding: 'utf-8',
  });
  const es5GeneratedFileContents = await readFile(`${__dirname}/output/index.js`, {
    encoding: 'utf-8',
  });
  const esmFixtureFileContents = await readFile(`${__dirname}/fixtures/output.es6.js`, {
    encoding: 'utf-8',
  });
  const esmGeneratedFileContents = await readFile(`${__dirname}/output/index.es6.js`, {
    encoding: 'utf-8',
  });
  t.is(es5FixtureFileContents, es5GeneratedFileContents);
  t.is(esmFixtureFileContents, esmGeneratedFileContents);
});