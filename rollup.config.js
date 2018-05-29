import path from 'path';
import inject from 'rollup-plugin-inject';
import legacy from 'rollup-plugin-legacy';

export default {
  input: 'src/L.GridLayer.MaskCanvas.js',
  output: {
    file: 'dist/L.GridLayer.MaskCanvas.js',
    format: 'iife'
  },
  context: 'window',
  plugins: [
    legacy({
      'src/QuadTree.js': 'QuadTree',
    }),
    inject({
      QuadTree: path.resolve('src/QuadTree.js'),
    }),
  ],
};
