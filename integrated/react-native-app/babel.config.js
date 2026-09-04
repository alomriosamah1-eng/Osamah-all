// سماح: في Expo SDK 54، babel-preset-expo يضيف react-native-worklets/plugin تلقائياً،
// لذلك لا نضيفه يدوياً (الإضافة المزدوجة قد تسبب فشل reanimated على iOS).
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};