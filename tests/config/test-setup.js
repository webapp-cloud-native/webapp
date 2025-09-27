// Global test setup
require('dotenv').config({ path: '.env.test' });

// Set test timeout
jest.setTimeout(30000);

// Global test hooks
beforeAll(async () => {
  // Any global setup if needed
});

afterAll(async () => {
  // Global cleanup
});