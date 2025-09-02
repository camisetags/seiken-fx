// Test configuration for different environments

export const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

// Performance thresholds adjusted for CI environment
export const THRESHOLDS = {
  // Basic operations (milliseconds)
  FAST: isCI ? 50 : 10,
  MEDIUM: isCI ? 1000 : 200,
  SLOW: isCI ? 2000 : 500,
  
  // Memory limits (MB)
  MEMORY_INCREASE: isCI ? 200 : 100,
  
  // Performance ratios
  MAX_PERFORMANCE_RATIO: isCI ? 200 : 100,
  
  // Operations per second minimums
  MIN_OPS_PER_SEC: {
    FAST: isCI ? 1000 : 10000,
    MEDIUM: isCI ? 100 : 1000,
    SLOW: isCI ? 10 : 100,
    VERY_SLOW: isCI ? 1 : 10
  }
};

// Utility to get appropriate timeout for operations
export const getTimeout = (baseTimeout: number): number => {
  return isCI ? baseTimeout * 3 : baseTimeout;
};

// Utility to get appropriate iteration count for benchmarks
export const getIterations = (baseIterations: number): number => {
  return isCI ? Math.floor(baseIterations / 2) : baseIterations;
};