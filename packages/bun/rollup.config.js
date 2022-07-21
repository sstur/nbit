import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

export default [
  {
    input: 'src/index.ts',
    output: {
      dir: 'build',
      format: 'esm',
      strict: false,
      esModule: false,
    },
    external: ['path'],
    plugins: [
      typescript({
        module: 'esnext',
        include: ['../**/*.ts'],
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
