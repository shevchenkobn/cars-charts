const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const { tempBundleName, nodeMajorVersion } = require('./webpack.consts');

module.exports = {
  entry: ['./src/app/index.ts', './src/styles/index.scss'],
  devtool: 'inline-source-map',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.csv$/,
        use: 'raw-loader'
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              implementation: require('sass'),
              sassOptions: {
                fiber: nodeMajorVersion >= 16 ? false : require('fibers'),
              },
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: tempBundleName,
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/'
  },
  plugins: [
    // Generates an `index.html` file with the <script> injected.
    new HtmlWebpackPlugin({
      inject: 'body',
      minify: true,
      template: path.resolve('src/index.html'),
    }),
  ]
};
