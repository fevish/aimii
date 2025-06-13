/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  module: {
    rules: [
      // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'.
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      // CSS loader for external CSS files
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.json', '.js', '.css'],
  },

  output: {
    path: path.join(__dirname, '/dist'),
    filename: '[name]/[name].js',
  },

  plugins: [],
  externals: {
    bufferutil: 'bufferutil',
    'utf-8-validate': 'utf-8-validate',
  },
};

