module.exports = {
  rootDir: '../..',
  moduleNameMapper: { '/@/(.*)$': '<rootDir>/src/$1' },
  transform: { '^.+\\.(t|j)sx?$': 'ts-jest' },
  globals: { 'ts-jest': { tsconfig: '测试文件/zip-test-tsconfig.json' } },
  testMatch: ['<rootDir>/测试文件/audio-batch-20261030/contract.test.ts']
}
