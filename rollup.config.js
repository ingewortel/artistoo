import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
  input: 'app/index.js',
  output: {
    file: 'build/cpm.js',
    format: 'iife',
	name: 'CPM'
  },
  plugins: [
    resolve(),
    commonjs()
  ]
};
