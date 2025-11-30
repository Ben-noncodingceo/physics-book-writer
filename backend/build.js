import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/index.js',
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  sourcemap: true,
  external: [],
  minify: process.env.NODE_ENV === 'production',
});

console.log('Build completed successfully!');
