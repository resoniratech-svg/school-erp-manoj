import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/errors/index.ts',
    'src/permissions/index.ts',
    'src/pagination/index.ts',
    'src/api/index.ts',
    'src/utils/index.ts',
    'src/constants/index.ts',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
});
