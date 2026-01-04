const path = require('path');

// Shared TypeScript rule.
const tsRule = {
  test: /\.ts$/,
  exclude: [
    /node_modules/, // never bundle deps
    /\.spec\.ts$/, // ignore any "*.spec.ts" tests
    /[\/\\]tests-e2e[\/\\]/, // ignore any files in root `tests-e2e/` folder (or sub-folders)
  ],
  use: [
    {
      loader: 'ts-loader',
      options: {
        onlyCompileBundledFiles: true,
        compilerOptions: {
          declaration: true,
          rootDir: './src',
        },
      },
    },
  ],
};

module.exports = [
  // ------------ CommonJS Build ------------
  {
    name: 'cjs',
    entry: './src/index.ts',
    target: 'node',
    mode: 'production',
    devtool: 'source-map',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'index.cjs.js',
      library: { type: 'commonjs2' },
    },
    resolve: {
      extensions: ['.ts'],
    },
    module: {
      rules: [tsRule],
    },
  },

  // ------------ ESM Build ------------
  {
    name: 'esm',
    entry: './src/index.ts',
    target: 'node',
    mode: 'production',
    devtool: 'source-map',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'index.esm.js',
      library: { type: 'module' },
    },
    experiments: {
      outputModule: true,
    },
    resolve: {
      extensions: ['.ts'],
    },
    module: {
      rules: [tsRule],
    },
  },
];
