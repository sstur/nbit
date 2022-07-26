import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import cleanup from 'rollup-plugin-cleanup';

export default [
  {
    input: 'src/index.ts',
    output: {
      dir: 'build',
      format: 'esm',
      strict: false,
      esModule: false,
    },
    external: ['fs', 'path'],
    plugins: [
      typescript({
        module: 'esnext',
        include: ['../**/*.ts'],
      }),
      cleanup({
        extensions: ['js', 'ts'],
      }),
    ],
  },
  {
    input: 'build/dts/index.d.ts',
    output: {
      file: 'build/index.d.ts',
      format: 'es',
    },
    plugins: [dts()],
  },
];
