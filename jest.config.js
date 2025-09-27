module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/database.js',
    '!server.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/config/test-setup.js'],
  testTimeout: 30000,
  verbose: true
};