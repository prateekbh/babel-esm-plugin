import test from 'ava';
import { getCompiler, defaultConfig, runWebpack } from '../webpack-utils';
import * as fs from 'fs';
import { promisify } from 'util';
import BabelEsmPlugin from '../../src';

const readFile = promisify(fs.readFile);

test('aliases is being tested', t => {
  t.pass();
});

test('aliases are being applied', async t => {
  const config = Object.assign({}, defaultConfig, {
    entry: {
      index: './tests/aliases/fixtures/index.js',
    },
    output: {
      path: `${__dirname}/output`,
      filename: 'index.js',
    },
    plugins: [
      new BabelEsmPlugin({
        alias: {
          POLYFILL: './modern-polyfill',
        },
      }),
    ],
    resolve: {
      alias: {
        POLYFILL: './legacy-polyfill',
      },
    },
  });
  const compiler = getCompiler(config);
  await runWebpack(compiler);
  const es5FixtureFileContents = await readFile(
    `${__dirname}/fixtures/output.js`,
    {
      encoding: 'utf-8',
    },
  );
  const es5GeneratedFileContents = await readFile(
    `${__dirname}/output/index.js`,
    {
      encoding: 'utf-8',
    },
  );
  const esmFixtureFileContents = await readFile(
    `${__dirname}/fixtures/output.es6.js`,
    {
      encoding: 'utf-8',
    },
  );
  const esmGeneratedFileContents = await readFile(
    `${__dirname}/output/index.es6.js`,
    {
      encoding: 'utf-8',
    },
  );
  t.is(es5FixtureFileContents, es5GeneratedFileContents);
  t.is(esmFixtureFileContents, esmGeneratedFileContents);
});
