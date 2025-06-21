/* eslint-disable @typescript-eslint/no-var-requires */
const config = require('./webpack.base.config');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

const rendererConfig = { ...config };
rendererConfig.target = 'electron-renderer';
rendererConfig.entry = {
  'renderer': './src/renderer/renderer.ts',
  'preload': './src/preload/preload.ts',
  'exclusive': './src/renderer/exclusive.ts',
  'my-main': './src/my-main.tsx',
  'widget': './src/widget.tsx'
};

rendererConfig.plugins.push(new HtmlWebpackPlugin({
  template: './src/renderer/index.html',
  filename: 'renderer/index.html',
  chunks: ['renderer'],
  publicPath: '',
  inject: false
}));

rendererConfig.plugins.push(new HtmlWebpackPlugin({
  template: './src/renderer/osr.html',
  filename: 'renderer/osr.html',
  inject: false
}));

rendererConfig.plugins.push(new HtmlWebpackPlugin({
  template: './src/renderer/exclusive.html',
  filename: 'exclusive/exclusive.html',
  chunks: ['exclusive'],
  inject: false
}));

rendererConfig.plugins.push(new HtmlWebpackPlugin({
  template: './public/my-main.html',
  filename: 'my-main.html',
  chunks: ['my-main'],
  inject: true
}));

rendererConfig.plugins.push(new HtmlWebpackPlugin({
  template: './public/widget.html',
  filename: 'widget/widget.html',
  chunks: ['widget'],
  inject: true
}));

module.exports = rendererConfig;
