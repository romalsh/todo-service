module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	rootDir: '.',
	roots: ['<rootDir>/src', '<rootDir>/libs'],
	testMatch: ['**/*.test.ts'],
	setupFiles: ['reflect-metadata'],
	moduleNameMapper: {
		'^@core/(.*)$': '<rootDir>/src/core/$1',
		'^@module/(.*)$': '<rootDir>/src/modules/$1',
		'^@libs/common$': '<rootDir>/libs/common/src',
	},
};
