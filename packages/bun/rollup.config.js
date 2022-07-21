import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

export default [
  {
    input: 'src/index.ts',
    output: {
      dir: 'lib',
      format: 'esm',
      strict: false,
      esModule: false,
    },
    plugins: [
      typescript({
        module: 'esnext',
        include: ['../**/*.ts'],
      }),
    ],
  },
  {
    input: 'lib/dts/index.d.ts',
    output: {
      file: 'lib/index.d.ts',
      format: 'es',
    },
    plugins: [dts()],
  },
];
