/**
 * @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
 */
module.exports = {
  _comment: "Configuración para Mutation Testing con Stryker",
  packageManager: "pnpm",
  reporters: ["html", "clear-text", "progress"],
  testRunner: "jest",
  coverageAnalysis: "perTest",
  mutate: [
    "src/domain/**/*.ts",
    "src/application/hooks/**/*.ts",
    "!src/**/*.test.ts"
  ],
  jest: {
    projectType: 'custom',
    configFile: 'jest.config.js',
    enableFindRelatedTests: true,
  }
};
