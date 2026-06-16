import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,
  dts: {
    compilerOptions: {
      ignoreDeprecations: '6.0'
    }
  },
  treeshake: true,
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  target: 'esnext',
  outDir: 'dist'
});
