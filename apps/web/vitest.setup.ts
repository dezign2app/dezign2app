import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Stub IntersectionObserver (not in jsdom)
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
