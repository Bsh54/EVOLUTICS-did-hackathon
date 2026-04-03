# Testing Documentation

## Overview

This document provides comprehensive information about the testing strategy, setup, and best practices for the e-IDStack App. Our testing approach follows industry best practices and ensures high code quality, reliability, and maintainability.

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Testing Stack](#testing-stack)
3. [Project Structure](#project-structure)
4. [Running Tests](#running-tests)
5. [Writing Tests](#writing-tests)
6. [Best Practices](#best-practices)
7. [Coverage](#coverage)
8. [Continuous Integration](#continuous-integration)

## Testing Philosophy

Our testing strategy follows the **Testing Pyramid** approach:

- **Unit Tests (70%)**: Test individual components, functions, and utilities in isolation
- **Integration Tests (20%)**: Test how components work together
- **E2E Tests (10%)**: Test complete user workflows

### Key Principles

1. **Test Behavior, Not Implementation**: Focus on what the code does, not how it does it
2. **Maintainable Tests**: Write tests that are easy to understand and maintain
3. **Fast Feedback**: Tests should run quickly to provide rapid feedback
4. **Comprehensive Coverage**: Aim for high test coverage while focusing on critical paths
5. **Realistic Scenarios**: Test real-world use cases and edge cases

## Testing Stack

### Core Testing Libraries

- **Jest**: Test runner and assertion library
- **React Native Testing Library**: Component testing utilities
- **@testing-library/react-native**: Provides accessible testing utilities
- **@testing-library/jest-native**: Extended matchers for Jest

### Mocking Libraries

- **jest-mock**: Built-in Jest mocking
- **Custom Mocks**: Located in `__tests__/mocks/`

### Development Tools

- **TypeScript**: Type-safe testing
- **ESLint**: Test code linting
- **Prettier**: Test code formatting

## Project Structure

```
__tests__/
├── setup/
│   └── jest.setup.js           # Global test setup
├── mocks/
│   ├── fileMock.js             # Static asset mocks
│   ├── react-native-vector-icons.js
│   ├── react-native-vision-camera.js
│   ├── async-storage.js
│   ├── encrypted-storage.js
│   ├── react-native-biometrics.js
│   ├── react-native-keychain.js
│   └── react-native-permissions.js
├── utils/
│   └── testUtils.tsx           # Reusable test utilities
├── screens/
│   ├── ScanQRScreen.test.tsx
│   ├── DashboardScreen.test.tsx
│   ├── CreatePinScreen.test.tsx
│   ├── VerifyPinScreen.test.tsx
│   └── ... (all screen tests)
├── components/
│   └── ... (component tests)
├── services/
│   └── ... (service tests)
└── utils/
    └── ... (utility tests)
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (recommended for development)
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test ScanQRScreen.test.tsx

# Run tests matching a pattern
npm test -- --testNamePattern="navigation"

# Clear Jest cache (if experiencing issues)
npm test -- --clearCache

# Update snapshots
npm test -- --updateSnapshot
```

### Advanced Commands

```bash
# Run tests with verbose output
npm test -- --verbose

# Run tests without cache
npm test -- --no-cache

# Run only changed tests (in git)
npm test -- --onlyChanged

# Run tests for specific folder
npm test __tests__/screens/

# Debug tests (Node inspector)
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Writing Tests

### Test File Naming

- Use `.test.tsx` or `.test.ts` suffix
- Place test files in `__tests__/` directory
- Mirror source file structure

### Test Structure

```typescript
/**
 * Test Suite for ComponentName
 * 
 * Description of what this test suite covers
 * 
 * @author Your Name
 * @version 1.0.0
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ComponentName from '../../../src/components/ComponentName';

describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test groups
  describe('Rendering', () => {
    it('should render without crashing', () => {
      const { getByText } = render(<ComponentName />);
      expect(getByText('Expected Text')).toBeTruthy();
    });
  });

  describe('User Interactions', () => {
    it('should handle button press', () => {
      const mockOnPress = jest.fn();
      const { getByText } = render(<ComponentName onPress={mockOnPress} />);
      
      fireEvent.press(getByText('Button'));
      expect(mockOnPress).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null props gracefully', () => {
      const { container } = render(<ComponentName data={null} />);
      expect(container).toBeTruthy();
    });
  });
});
```

### Common Patterns

#### Testing Component Rendering

```typescript
it('should render with props', () => {
  const { getByText, getByTestId } = render(
    <MyComponent title="Test" />
  );
  
  expect(getByText('Test')).toBeTruthy();
  expect(getByTestId('component-container')).toBeTruthy();
});
```

#### Testing User Interactions

```typescript
it('should handle user input', () => {
  const mockOnChange = jest.fn();
  const { getByPlaceholderText } = render(
    <InputComponent onChange={mockOnChange} />
  );
  
  fireEvent.changeText(
    getByPlaceholderText('Enter text'),
    'New value'
  );
  
  expect(mockOnChange).toHaveBeenCalledWith('New value');
});
```

#### Testing Async Operations

```typescript
it('should fetch data on mount', async () => {
  const mockFetch = jest.fn(() => 
    Promise.resolve({ data: 'test' })
  );
  
  const { getByText } = render(<AsyncComponent fetch={mockFetch} />);
  
  await waitFor(() => {
    expect(mockFetch).toHaveBeenCalled();
    expect(getByText('test')).toBeTruthy();
  });
});
```

#### Testing Navigation

```typescript
it('should navigate to detail screen', () => {
  const mockNavigate = jest.fn();
  (useNavigation as jest.Mock).mockReturnValue({
    navigate: mockNavigate,
  });
  
  const { getByText } = render(<ListScreen />);
  
  fireEvent.press(getByText('View Details'));
  expect(mockNavigate).toHaveBeenCalledWith('Details', { id: 1 });
});
```

#### Testing Redux Integration

```typescript
it('should dispatch action on button press', () => {
  const mockDispatch = jest.fn();
  (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
  
  const { getByText } = render(<ConnectedComponent />);
  
  fireEvent.press(getByText('Save'));
  expect(mockDispatch).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'SAVE' })
  );
});
```

## Best Practices

### 1. Test Naming

- Use descriptive test names that explain the expected behavior
- Follow the pattern: "should [expected behavior] when [condition]"

```typescript
// Good
it('should display error message when login fails', () => {});

// Avoid
it('test login', () => {});
```

### 2. Arrange-Act-Assert Pattern

```typescript
it('should update count when increment button is pressed', () => {
  // Arrange
  const { getByText } = render(<Counter initialCount={0} />);
  
  // Act
  fireEvent.press(getByText('Increment'));
  
  // Assert
  expect(getByText('Count: 1')).toBeTruthy();
});
```

### 3. Test One Thing at a Time

```typescript
// Good - each test focuses on one behavior
it('should show error for invalid email', () => {});
it('should show error for empty password', () => {});

// Avoid - testing multiple things
it('should validate form', () => {});
```

### 4. Use Test Utilities

```typescript
import { renderWithProviders } from '../utils/testUtils';

it('should render with redux store', () => {
  const { getByText } = renderWithProviders(<MyComponent />, {
    initialState: { user: { name: 'Test' } },
  });
  
  expect(getByText('Test')).toBeTruthy();
});
```

### 5. Avoid Implementation Details

```typescript
// Good - tests behavior
it('should show success message after save', () => {
  const { getByText } = render(<Form />);
  fireEvent.press(getByText('Save'));
  expect(getByText('Saved successfully')).toBeTruthy();
});

// Avoid - tests implementation
it('should call setState with success true', () => {
  // Testing internal state
});
```

### 6. Mock External Dependencies

```typescript
jest.mock('../services/api', () => ({
  fetchUser: jest.fn(() => Promise.resolve({ id: 1 })),
}));
```

### 7. Clean Up After Tests

```typescript
afterEach(() => {
  jest.clearAllMocks();
  cleanup();
});
```

### 8. Use snapshots Sparingly

```typescript
// Use for stable UI components
it('should match snapshot', () => {
  const tree = renderer.create(<Header title="Test" />).toJSON();
  expect(tree).toMatchSnapshot();
});
```

## Coverage

### Coverage Targets

- **Statements**: 70%
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%

### Viewing Coverage

```bash
# Generate coverage report
npm test -- --coverage

# Open HTML coverage report
open coverage/lcov-report/index.html
```

### Coverage by Directory

Focus on high coverage for:
- **Critical Paths**: Authentication, credential handling
- **Complex Logic**: Business logic, data transformations
- **Reusable Components**: Shared UI components

Lower coverage acceptable for:
- **Configuration Files**: Build configs, constants
- **Type Definitions**: TypeScript type files
- **Third-party Integrations**: External library wrappers

## Continuous Integration

### Pre-commit Hooks

```bash
# Run tests before commit
npm test -- --onlyChanged --bail
```

### CI Pipeline

1. **Install Dependencies**: `npm ci`
2. **Run Linter**: `npm run lint`
3. **Run Tests**: `npm test -- --coverage`
4. **Upload Coverage**: Upload to coverage service

### Required Checks

- All tests must pass
- Coverage must meet thresholds
- No TypeScript errors
- Linting passes

## Troubleshooting

### Common Issues

#### Issue: "Cannot find module"

**Solution**: Clear Jest cache

```bash
npm test -- --clearCache
```

#### Issue: "Timeout"

**Solution**: Increase timeout for async tests

```typescript
it('should fetch data', async () => {
  // ...
}, 10000); // 10 second timeout
```

#### Issue: "Snapshot mismatch"

**Solution**: Review changes and update if legitimate

```bash
npm test -- --updateSnapshot
```

#### Issue: "React state update warnings"

**Solution**: Wrap state updates in `act()`

```typescript
import { act } from '@testing-library/react-native';

await act(async () => {
  fireEvent.press(button);
});
```

## Resources

### Documentation

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing Library](https://testing-library.com/docs/react-native-testing-library/intro)

### Articles

- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)

## Contributing

When adding new tests:

1. Follow the established patterns
2. Write clear, descriptive test names
3. Include comments for complex test logic
4. Ensure all tests pass before submitting PR
5. Update this documentation if adding new patterns

---

**Last Updated**: January 2026
**Maintained By**: Development Team
