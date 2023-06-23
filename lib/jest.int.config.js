/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.int-test.json'
    }
  },
  detectOpenHandles: true,
  forceExit: true,
  testMatch: ["<rootDir>/integration-test/*.spec.ts"],
};