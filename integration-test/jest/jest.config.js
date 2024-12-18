/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jsdom",
  transformIgnorePatterns: [],
  setupFilesAfterEnv: ["<rootDir>/setupAfterEnv.jest.ts"],
};

module.exports = config;
