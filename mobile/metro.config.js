const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Custom resolver to mock native-only packages (like react-native-maps) on Web platform
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    if (moduleName === 'react-native-maps') {
      return {
        type: 'empty',
      };
    }
  }
  // Fallback to default resolver
  return context.resolveRequest
    ? context.resolveRequest(context, moduleName, platform)
    : require('metro-resolver').resolve(context, moduleName, platform);
};

module.exports = config;
