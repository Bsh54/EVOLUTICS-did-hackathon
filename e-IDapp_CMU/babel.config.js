module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        // Allow missing .env file - variables will be undefined if file doesn't exist
        // This is important for production builds where .env may not be available
        allowUndefined: true,
        safe: false, // Don't fail if .env is missing
      },
    ],
    'react-native-worklets/plugin'
  ],
};
