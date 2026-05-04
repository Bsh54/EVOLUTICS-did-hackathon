const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { resolver: { sourceExts, assetExts } } = getDefaultConfig(__dirname);

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...sourceExts, 'svg', 'js', 'json', 'ts', 'tsx', 'cjs'], 
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
