/** @type {import('jest').Config} */
export default {
  preset: "ts-jest",
  testEnvironment: "node",

  rootDir: ".",

  /* ===============================
     TRANSFORM
  =============================== */
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.test.json",
      },
    ],
  },

  /* ===============================
     PATH ALIASES (Feature-First)
  =============================== */
  moduleNameMapper: {
    "^#app/(.*)$": "<rootDir>/src/$1",
  },

  modulePathIgnorePatterns: ["<rootDir>/dist/"],

  /* ===============================
     TEST LOCATION
  =============================== */
  testMatch: ["<rootDir>/tests/**/*.test.ts", "<rootDir>/tests/**/*.spec.ts"],

  testPathIgnorePatterns: ["<rootDir>/src/"],

  /* ===============================
     PERFORMANCE & CLEANLINESS
  =============================== */
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
};
