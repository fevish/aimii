/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  watch: false,
  context: __dirname,
  watchOptions: {
    ignored: /node_modules/,
    aggregateTimeout: 300,
    // Use native file watching instead of polling
    poll: false,
    // Disable following symlinks and restrict to project directory
    followSymlinks: false
  },
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
        use: [
          'style-loader',
          'css-loader'
        ]
      },
      // SVG loader - handle SVGs differently based on usage
      {
        test: /\.svg$/,
        oneOf: [
          // For React components (SvgIcon) - convert to React components using SVGR
          {
            resourceQuery: /react/,
            use: ['@svgr/webpack']
          },
          // For CSS and other uses - treat as files
          {
            type: 'asset/resource',
            generator: {
              filename: 'assets/svg/[name][ext]'
            }
          }
        ]
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.json', '.js', '.css', '.svg'],
  },

  output: {
    path: path.join(__dirname, '/dist'),
    filename: '[name]/[name].js',
  },

  plugins: [
    // Copy icon to dist root
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'public/icons/icon.ico',
          to: 'icon.ico'
        },
        {
          from: 'src/assets/svg',
          to: 'assets/svg'
        }
      ]
    })
  ],
  externals: {
    bufferutil: 'bufferutil',
    'utf-8-validate': 'utf-8-validate',
  },
};