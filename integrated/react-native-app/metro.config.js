// تهيئة Metro — إضافة محاكي تجريبي (web-only shim) لـ expo-sqlite حتى يمكن معاينة التطبيق في المتصفح.
// أندرويد و iOS لا يتأثران نهائياً.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'expo-sqlite') {
    return {
      type: 'sourceFile',
      filePath: require.resolve('./web-shims/expo-sqlite.js'),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;