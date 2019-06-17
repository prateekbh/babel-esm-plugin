import test from 'ava';
import { getCompiler, defaultConfig, runWebpack } from '../webpack-utils';
import * as fs from 'fs';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);

test('dynamic-entries single file string', async t => {
  const config = Object.assign({}, defaultConfig, {
    entry: () => './tests/dynamic-entries/fixtures/first.js',
    output: {
      path: `${__dirname}/output`,
      filename: 'index.js',
    },
  });
  const compiler = getCompiler(config);
  await runWebpack(compiler);
  const es5FixtureFileContents = await readFile(
    `${__dirname}/fixtures/string.js`,
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
    `${__dirname}/fixtures/string.es6.js`,
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

test('dynamic-entries single file object', async t => {
  const config = Object.assign({}, defaultConfig, {
    entry: () => ({
      object: './tests/dynamic-entries/fixtures/first.js',
    }),
    output: {
      path: `${__dirname}/output`,
    },
  });
  const compiler = getCompiler(config);
  await runWebpack(compiler);
  const es5FixtureFileContents = await readFile(
    `${__dirname}/fixtures/object.js`,
    {
      encoding: 'utf-8',
    },
  );
  const es5GeneratedFileContents = await readFile(
    `${__dirname}/output/object.js`,
    {
      encoding: 'utf-8',
    },
  );
  const esmFixtureFileContents = await readFile(
    `${__dirname}/fixtures/object.es6.js`,
    {
      encoding: 'utf-8',
    },
  );
  const esmGeneratedFileContents = await readFile(
    `${__dirname}/output/object.es6.js`,
    {
      encoding: 'utf-8',
    },
  );
  t.is(es5FixtureFileContents, es5GeneratedFileContents);
  t.is(esmFixtureFileContents, esmGeneratedFileContents);
});

test('dynamic-entries single file promise', async t => {
  const config = Object.assign({}, defaultConfig, {
    entry: async () => ({
      promise: './tests/dynamic-entries/fixtures/first.js',
    }),
    output: {
      path: `${__dirname}/output`,
    },
  });
  const compiler = getCompiler(config);
  await runWebpack(compiler);
  const es5FixtureFileContents = await readFile(
    `${__dirname}/fixtures/promise.js`,
    {
      encoding: 'utf-8',
    },
  );
  const es5GeneratedFileContents = await readFile(
    `${__dirname}/output/promise.js`,
    {
      encoding: 'utf-8',
    },
  );
  const esmFixtureFileContents = await readFile(
    `${__dirname}/fixtures/promise.es6.js`,
    {
      encoding: 'utf-8',
    },
  );
  const esmGeneratedFileContents = await readFile(
    `${__dirname}/output/promise.es6.js`,
    {
      encoding: 'utf-8',
    },
  );
  t.is(es5FixtureFileContents, es5GeneratedFileContents);
  t.is(esmFixtureFileContents, esmGeneratedFileContents);
});
