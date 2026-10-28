// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Proporciona el path a tu app Next.js para cargar env vars en los tests
  dir: './',
})

// Configuración personalizada para Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/tests/e2e/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^server-only$': '<rootDir>/node_modules/next/dist/compiled/server-only/empty.js',
  },
  clearMocks: true,
}

module.exports = createJestConfig(customJestConfig)
