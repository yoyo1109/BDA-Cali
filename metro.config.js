const { getDefaultConfig } = require('expo/metro-config');

console.log('Using custom Metro config with .cjs support');

const config = getDefaultConfig(__dirname);
const platforms = config.resolver.platforms || [];
config.resolver.platforms = Array.from(
    new Set([...platforms, 'ios', 'android', 'native'])
);
console.log('Resolver platforms:', config.resolver.platforms);
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

module.exports = config;
