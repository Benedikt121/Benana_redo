const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.resolver.unstable_conditionNames = [
  "browser",
  "require",
  "react-native",
];

module.exports = withNativewind(config);
