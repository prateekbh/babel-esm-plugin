import test from 'ava';
import { getCompiler, defaultConfig, runWebpack } from '../webpack-utils';
import * as fs from 'fs';
import { promisify } from 'util';
import BabelEsmPlugin from '../../src/index';

const readFile = promisify(fs.readFile);
test('runtime-chunk is being tested', t => {
  t.pass();
});

test('esm files are being generated', async t => {
  const config = Object.assign({}, defaultConfig, {
    entry: {
      first: './tests/runtime-chunk/fixtures/first.js',
      second: './tests/runtime-chunk/fixtures/second.js',
    },
    output: {
      path: `${__dirname}/output`,
    },
    optimization: {
      ...defaultConfig.optimization,
      runtimeChunk: 'single',
    },
    plugins: [
      new BabelEsmPlugin({
        chunkFilename: '[name].es6.js',
      }),
    ],
  });
  const compiler = getCompiler(config);
  await runWebpack(compiler);
  const files = [
    {
      fixture: 'first-output.js',
      output: 'first.js',
    },
    {
      fixture: 'second-output.js',
      output: 'second.js',
    },
    {
      fixture: 'first.es6.js',
      output: 'first.es6.js',
    },
    {
      fixture: 'second.es6.js',
      output: 'second.es6.js',
    },
    {
      fixture: 'runtime.js',
      output: 'runtime.js',
    },
    {
      fixture: 'runtime.es6.js',
      output: 'runtime.es6.js',
    },
  ];

  for (const file of files) {
    const fixtureFileContents = await readFile(
      `${__dirname}/fixtures/${file.fixture}`,
      {
        encoding: 'utf-8',
      },
    );
    const generatedFileContents = await readFile(
      `${__dirname}/output/${file.output}`,
      {
        encoding: 'utf-8',
      },
    );
    t.is(fixtureFileContents, generatedFileContents);
  }
});
