const config = require('./webpack.config');
const { tempBundleName, inlineBundleRegex } = require('./webpack.consts');

config.mode = 'development';
config.output.clean = true;

module.exports = config;
