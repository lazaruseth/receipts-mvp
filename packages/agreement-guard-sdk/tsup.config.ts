import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'adapters/index': 'src/adapters/index.ts',
    'adapters/base': 'src/adapters/base.ts',
    'adapters/claude': 'src/adapters/claude.ts',
    'adapters/openai': 'src/adapters/openai.ts',
    'adapters/langchain': 'src/adapters/langchain.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  external: [
    '@anthropic-ai/sdk',
    'openai',
    '@langchain/core',
    'langchain',
  ],
  esbuildOptions(options) {
    options.banner = {
      js: '/* @receipts/agreement-guard - https://receipts.fi */',
    };
  },
});
