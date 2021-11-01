const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');
const RemovePlugin = require('remove-files-webpack-plugin');

const config = require('./webpack.config');
const { tempBundleName, inlineBundleRegex } = require('./webpack.consts');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

config.plugins.push(
  // Inlines chunks with `runtime` in the name
  new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [inlineBundleRegex]),
  new RemovePlugin({
    after: {
      include: [
        path.resolve(__dirname, 'dist', tempBundleName),
      ]
    }
  })
);
config.mode = 'production';

module.exports = config;
