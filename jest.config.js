// eslint-disable-next-line no-undef
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Explicitly configure ts-jest to be permissive
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        noUnusedLocals: false,
        noUnusedParameters: false
      }
    }],
    '^.+\\.jsx?$': ['ts-jest', {
      tsconfig: {
        allowJs: true,
        noUnusedLocals: false,
        noUnusedParameters: false
      }
    }]
  },
  // Ensure @faker-js is processed by ts-jest
  transformIgnorePatterns: [
    "node_modules/(?!@faker-js)"
  ],
  moduleNameMapper: {
    '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@models/(.*)$': '<rootDir>/src/models/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@routes/(.*)$': '<rootDir>/src/routes/$1',
    '^@validators/(.*)$': '<rootDir>/src/validators/$1',
    '^@dto/(.*)$': '<rootDir>/src/types/dto/$1',
  },
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  setupFiles: ["<rootDir>/jest.setup.js"],
  testMatch: [
    "<rootDir>/tests/**/*.test.ts",
    "<rootDir>/tests/**/*.spec.ts"
  ],
  testPathIgnorePatterns: [
    "<rootDir>/src/"
  ],
};
