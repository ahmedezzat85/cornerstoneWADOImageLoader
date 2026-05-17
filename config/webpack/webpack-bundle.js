const path = require('path');
const webpack = require('webpack');
const rootPath = process.cwd();
const context = path.join(rootPath, 'src');
const codecs = path.join(rootPath, 'codecs');
const outputPath = path.join(rootPath, 'dist');
const TerserPlugin = require('terser-webpack-plugin');

const BundleAnalyzerPlugin =
  require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

// Exclude function - handles Windows backslash paths + vendor codec files
const isExcludedFromLinting = (modulePath) =>
  /node_modules/.test(modulePath) ||
  /codecs/.test(modulePath) ||
  modulePath.includes('chafey-openjpeg') ||
  modulePath.includes('openjpegwasm') ||
  modulePath.includes('openjpegjs');

const isExcludedFromBabel = (modulePath) =>
  /node_modules/.test(modulePath) ||
  /codecs/.test(modulePath) ||
  modulePath.includes('chafey-openjpeg') ||
  modulePath.includes('openjpegwasm') ||
  modulePath.includes('openjpegjs');

module.exports = {
  mode: 'production',
  context,
  entry: {
    cornerstoneWADOImageLoader: './imageLoader/index.js',
    cornerstoneWADOImageLoaderNoWebWorkers: './imageLoader/index-noWorkers.js',
  },
  target: 'web',
  output: {
    library: {
      name: 'cornerstoneWADOImageLoader',
      type: 'umd',
      umdNamedDefine: true,
    },
    globalObject: 'this',
    path: outputPath,
    filename: '[name].bundle.min.js',
  },
  devtool: 'source-map',
  externals: {
    'dicom-parser': {
      commonjs: 'dicom-parser',
      commonjs2: 'dicom-parser',
      amd: 'dicom-parser',
      root: 'dicomParser',
    },
  },
  resolve: {
    fallback: {
      fs: false,
      path: false,
    },
  },
  module: {
    noParse: [/(codecs)/],
    rules: [
      {
        enforce: 'pre',
        test: /\.js$/,
        exclude: isExcludedFromLinting,
        loader: 'eslint-loader',
        options: {
          failOnError: false,
        },
      },
      {
        test: /\.wasm/,
        type: 'asset/inline',
      },
      {
        test: /\.worker\.js$/,
        use: [
          {
            loader: 'worker-loader',
            options: { inline: 'fallback' },
          },
          {
            loader: 'babel-loader',
          },
        ],
      },
      {
        test: /\.js$/,
        exclude: isExcludedFromBabel,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: path.join(codecs, 'jpeg.js'),
        loader: 'exports-loader',
        options: {
          type: 'commonjs',
          exports: 'JpegImage',
        },
      },
    ],
  },
  plugins: [
    new webpack.ProgressPlugin(),
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
  ],
  experiments: {
    asyncWebAssembly: true,
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        parallel: true,
      }),
    ],
  },
};
