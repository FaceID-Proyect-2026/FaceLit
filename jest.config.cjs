module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
  clearMocks: true,
  // Native component transforms can take longer on a cold Windows runner.
  testTimeout: 15000,
  collectCoverageFrom: [
    'shared/components/ui/RemoteDataState.tsx',
    'shared/hooks/useAuthGuard.ts',
    'shared/hooks/useRoleGuard.ts',
    'features/auth/hooks/useLoginForm.ts',
    'shared/services/authService.js',
    'shared/services/facialAttendanceService.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'html', 'lcov', 'json-summary'],
};
