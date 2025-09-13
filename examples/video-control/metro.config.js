const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withMetroConfig } = require('react-native-monorepo-config');

const root = path.resolve(__dirname, '../..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = withMetroConfig(config, {
  root,
  dirname: __dirname,
});
