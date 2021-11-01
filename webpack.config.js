const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const { tempBundleName } = require('./webpack.consts');

module.exports = {
  entry: './src/app/index.ts',
  devtool: 'inline-source-map',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: tempBundleName,
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    // Generates an `index.html` file with the <script> injected.
    new HtmlWebpackPlugin({
      inject: 'body',
      minify: { collapseWhitespace: false },
      template: path.resolve('src/index.html'),
    }),
  ]
};
