const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const { tempBundleName, nodeMajorVersion } = require('./webpack.consts');

const cssExt = '\\.(s[ac]|ic)ss$'

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
        type: 'asset/source'
      },
      {
        test: new RegExp(cssExt, 'i'),
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                auto: new RegExp('module' + cssExt, 'i'),
                mode: 'icss',
                localIdentName: '[local]',
              }
            },
          },
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
