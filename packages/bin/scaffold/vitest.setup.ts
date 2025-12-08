// Vitest setup file for scaffold CLI tests
import { vi } from "vitest";

// Mock fs-extra for file system operations in tests
vi.mock("fs-extra", async () => {
  const actual = await vi.importActual("fs-extra");
  return {
    ...actual,
    // Add specific mocks as needed
  };
});

// Mock ora spinner for cleaner test output
vi.mock("ora", () => ({
  default: () => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    warn: vi.fn().mockReturnThis(),
    info: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    text: "",
  }),
}));

// Global test utilities
global.console = {
  ...console,
  // Optionally silence certain console methods during tests
  // log: vi.fn(),
  // debug: vi.fn(),
};
