#!/usr/bin/env node

/**
 * Test Runner Script
 * 
 * Professional test execution script with various options
 * 
 * @author Senior React Native Developer
 * @version 1.0.0
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
};

/**
 * Print colored message
 */
function print(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Print section header
 */
function printHeader(title) {
    console.log('\n' + '='.repeat(60));
    print(title, 'cyan');
    console.log('='.repeat(60) + '\n');
}

/**
 * Execute command and handle errors
 */
function execute(command, options = {}) {
    try {
        execSync(command, { stdio: 'inherit', ...options });
        return true;
    } catch (error) {
        if (!options.ignoreErrors) {
            print(`Error executing: ${command}`, 'red');
        }
        return false;
    }
}

/**
 * Main test runner menu
 */
function showMenu() {
    printHeader('PolyID Holder App - Test Runner');

    print('Available Commands:', 'bright');
    console.log('');
    print('1. npm run test:all          - Run all tests', 'green');
    print('2. npm run test:watch        - Run tests in watch mode', 'green');
    print('3. npm run test:coverage     - Run tests with coverage', 'green');
    print('4. npm run test:screens      - Run only screen tests', 'green');
    print('5. npm run test:components   - Run only component tests', 'green');
    print('6. npm run test:services     - Run only service tests', 'green');
    print('7. npm run test:verbose      - Run tests with verbose output', 'green');
    print('8. npm run test:clear        - Clear Jest cache', 'green');
    print('9. npm run test:update       - Update snapshots', 'green');
    print('10. npm run test:specific    - Run specific test file', 'green');
    console.log('');

    print('Quick Examples:', 'bright');
    console.log('');
    print('npm test ScanQRScreen        - Test specific screen', 'yellow');
    print('npm test -- --watch          - Watch mode', 'yellow');
    print('npm test -- --coverage       - With coverage', 'yellow');
    console.log('');
}

/**
 * Check if Jest is installed
 */
function checkJestInstallation() {
    const nodeModulesPath = path.join(__dirname, '..', 'node_modules', 'jest');

    if (!fs.existsSync(nodeModulesPath)) {
        print('⚠️  Jest is not installed!', 'red');
        print('Installing dependencies...', 'yellow');
        execute('npm install');
    }
}

/**
 * Run all tests
 */
function runAllTests() {
    printHeader('Running All Tests');
    execute('npm test');
}

/**
 * Run tests with coverage
 */
function runCoverage() {
    printHeader('Running Tests with Coverage');
    execute('npm test -- --coverage');

    print('\nCoverage report generated!', 'green');
    print('Open: coverage/lcov-report/index.html', 'cyan');
}

/**
 * Run tests in watch mode
 */
function runWatch() {
    printHeader('Running Tests in Watch Mode');
    print('Press ENTER to run tests, Type "p" to filter by pattern', 'yellow');
    execute('npm test -- --watch');
}

/**
 * Run screen tests only
 */
function runScreenTests() {
    printHeader('Running Screen Tests');
    execute('npm test __tests__/screens/');
}

/**
 * Check test setup
 */
function checkSetup() {
    printHeader('Checking Test Setup');

    const requiredFiles = [
        '__tests__/setup/jest.setup.js',
        '__tests__/mocks/fileMock.js',
        '__tests__/utils/testUtils.tsx',
        'jest.config.js',
    ];

    let allPresent = true;

    requiredFiles.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        if (fs.existsSync(filePath)) {
            print(`✓ ${file}`, 'green');
        } else {
            print(`✗ ${file} - MISSING`, 'red');
            allPresent = false;
        }
    });

    if (allPresent) {
        print('\n✓ All test setup files present!', 'green');
    } else {
        print('\n⚠️  Some test files are missing', 'yellow');
    }
}

/**
 * Show test statistics
 */
function showStats() {
    printHeader('Test Statistics');

    const testsDir = path.join(__dirname, '..', '__tests__');

    function countFiles(dir, extension) {
        if (!fs.existsSync(dir)) return 0;

        const files = fs.readdirSync(dir);
        return files.filter(file => file.endsWith(extension)).length;
    }

    const screenTests = countFiles(path.join(testsDir, 'screens'), '.test.tsx');
    const componentTests = countFiles(path.join(testsDir, 'components'), '.test.tsx');
    const serviceTests = countFiles(path.join(testsDir, 'services'), '.test.ts');
    const mockFiles = countFiles(path.join(testsDir, 'mocks'), '.js');

    console.log('Test Files:');
    print(`  Screen Tests:    ${screenTests}`, 'cyan');
    print(`  Component Tests: ${componentTests}`, 'cyan');
    print(`  Service Tests:   ${serviceTests}`, 'cyan');
    print(`  Mock Files:      ${mockFiles}`, 'cyan');

    const totalTests = screenTests + componentTests + serviceTests;
    print(`\nTotal Test Files: ${totalTests}`, 'green');
}

/**
 * Main execution
 */
function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        showMenu();
        return;
    }

    const command = args[0];

    switch (command) {
        case 'all':
            runAllTests();
            break;
        case 'coverage':
            runCoverage();
            break;
        case 'watch':
            runWatch();
            break;
        case 'screens':
            runScreenTests();
            break;
        case 'check':
            checkSetup();
            break;
        case 'stats':
            showStats();
            break;
        default:
            showMenu();
    }
}

// Execute
main();
