module.exports = {
    rootDir: '..',
    testEnvironment: 'jsdom',
    moduleNameMapper: { '/@/(.*)$': '<rootDir>/src/$1' },
    transform: { '^.+\\.vue$': 'vue-jest', '^.+\\.(t|j)sx?$': 'ts-jest' },
    globals: { 'ts-jest': { tsconfig: '测试文件/zip-test-tsconfig.json' } },
    testMatch: ['<rootDir>/tests/*.test.ts', '<rootDir>/测试文件/standalone-audio/*.test.ts', '<rootDir>/测试文件/audio-batch-20261030/contract.test.ts']
}
