/**
 * Jest Configuration for React Native Testing
 * 
 * This configuration file sets up the testing environment for a React Native application
 * with comprehensive testing capabilities including mocking, transformers, and coverage.
 * 
 * @author Senior React Native Developer
 * @description Professional-grade Jest configuration for enterprise-level testing
 */

module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-.*|@react-navigation|@credo-ts|@reduxjs|react-redux|immer|uuid|@hyperledger)/)',
  ],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__tests__/mocks/fileMock.js',
    '@nozbe/watermelondb/Database': '<rootDir>/__tests__/mocks/watermelon-db.js',
    '@nozbe/watermelondb': '<rootDir>/__tests__/mocks/watermelon-db.js',
    '../../utils/database': '<rootDir>/__tests__/mocks/database.js',
  },

  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx|js)',
  ],

  collectCoverageFrom: [
    'src/screens/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],

  testTimeout: 10000,
  clearMocks: true,
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@credo-ts|@hyperledger|react-native-aes-crypto|react-native-fs|@reduxjs/toolkit|immer)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
