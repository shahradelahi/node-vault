import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,
  dts: true,
  treeshake: true,
  minify: 'terser',
  terserOptions: {
    format: {
      comments: false
    }
  },
  noExternal: ['lodash'],
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  target: 'esnext',
  outDir: 'dist'
});
