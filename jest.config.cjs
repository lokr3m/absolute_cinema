module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/backend/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    '<rootDir>/backend/**/*.js',
    '!<rootDir>/backend/addSessions.js',
    '!<rootDir>/backend/seed.js'
  ],
  coveragePathIgnorePatterns: ['/node_modules/']
};
