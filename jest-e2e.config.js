module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	rootDir: '.',
	roots: ['<rootDir>/tests'],
	testMatch: ['**/*.e2e.test.ts'],
	setupFiles: ['reflect-metadata'],
	moduleNameMapper: {
		'^@core/(.*)$': '<rootDir>/src/core/$1',
		'^@module/(.*)$': '<rootDir>/src/modules/$1',
		'^@libs/common$': '<rootDir>/libs/common/src',
	},
	globalSetup: '<rootDir>/tests/globalSetup.ts',
	globalTeardown: '<rootDir>/tests/globalTeardown.ts',
	testTimeout: 60000,
};
