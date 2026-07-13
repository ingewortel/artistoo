import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
//import { eslint } from 'rollup-plugin-eslint';
//import eslint from 'rollup-plugin-eslint';
//import eslint from '@rollup/plugin-eslint'; 

import eslint from "@rollup/plugin-eslint"
//import resolve from "@rollup/plugin-node-resolve"
//import commonjs from "@rollup/plugin-commonjs"


export default [{
  input: 'app/index.js',
  external: ['module', 'canvas', 'fs'], 
  output: {
    file: 'build/artistoo.js',
    format: 'iife',
	name: 'CPM',
	globals: {
      "module": "(typeof module !== 'undefined' ? module : { exports: {} })",
      canvas: 'canvas',
      fs: 'fs'
    }
  },
  plugins: [
    eslint(),
    resolve(),
    commonjs()
  ]
},{
  input: 'app/index.js',
  external: ['module', 'canvas', 'fs', 'mersenne-twister'], 
  output: {
    file: 'build/artistoo-cjs.js',
    format: 'cjs',
	name: 'CPM'
  },
  plugins:[
  ]
}];
