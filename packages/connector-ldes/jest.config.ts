import type { JestConfigWithTsJest } from 'ts-jest'

const config: JestConfigWithTsJest = {
    extensionsToTreatAsEsm: ['.ts'],
    verbose: true,
    clearMocks: true,
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',
    transform: {
        '^.+\\.(ts|tsx)?$': ['ts-jest', { useESM: true }]
    },
    testPathIgnorePatterns: ['<rootDir>/node_modules/', './dist'],
    collectCoverage: true,
    coveragePathIgnorePatterns: [
        "/node_modules/",
        "/mocks/",
        "index.js"
    ],
    coverageThreshold: {
        global: {
            "branches": 100,
            "functions": 100,
            "lines": 100,
            "statements": 100
        }
    }
}

export default config;