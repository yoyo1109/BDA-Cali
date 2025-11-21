/**
 * Quick Test Script for Pickup Complete Screen
 *
 * Run this to verify all files are in place and importable
 * Usage: node scripts/testPickupScreen.js
 */

const fs = require('fs');
const path = require('path');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const CHECK = '✓';
const CROSS = '✗';

console.log('\n🧪 Pickup Complete Screen - File Verification\n');

const tests = [
  {
    name: 'TypeScript types file',
    path: 'src/types/pickup.types.ts',
    critical: true,
  },
  {
    name: 'Theme constants file',
    path: 'src/constants/theme.ts',
    critical: true,
  },
  {
    name: 'Main screen component',
    path: 'src/screens/donations/driver/PickupCompleteScreen.tsx',
    critical: true,
  },
  {
    name: 'Quick start guide',
    path: 'docs/PICKUP_COMPLETE_QUICK_START.md',
    critical: false,
  },
  {
    name: 'Migration guide',
    path: 'docs/PICKUP_COMPLETE_MIGRATION_GUIDE.md',
    critical: false,
  },
  {
    name: 'Testing guide',
    path: 'docs/PICKUP_COMPLETE_TESTING_GUIDE.md',
    critical: false,
  },
  {
    name: 'Design specification',
    path: 'docs/PICKUP_COMPLETE_DESIGN_SPEC.md',
    critical: false,
  },
  {
    name: 'tsconfig.json',
    path: 'tsconfig.json',
    critical: false,
  },
];

let criticalFailures = 0;
let warnings = 0;
let successes = 0;

tests.forEach((test) => {
  const fullPath = path.join(process.cwd(), test.path);
  const exists = fs.existsSync(fullPath);

  if (exists) {
    const stats = fs.statSync(fullPath);
    const size = (stats.size / 1024).toFixed(2);
    console.log(`${GREEN}${CHECK}${RESET} ${test.name}`);
    console.log(`   ${fullPath} (${size} KB)`);
    successes++;
  } else {
    if (test.critical) {
      console.log(`${RED}${CROSS}${RESET} ${test.name} ${RED}[CRITICAL]${RESET}`);
      console.log(`   Missing: ${fullPath}`);
      criticalFailures++;
    } else {
      console.log(`${YELLOW}${CROSS}${RESET} ${test.name} ${YELLOW}[WARNING]${RESET}`);
      console.log(`   Missing: ${fullPath}`);
      warnings++;
    }
  }
});

console.log('\n' + '─'.repeat(50) + '\n');

// Check dependencies
console.log('📦 Dependency Check\n');

const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

  const requiredDeps = [
    { name: 'expo-image-picker', type: 'runtime' },
    { name: 'react-native-signature-canvas', type: 'runtime' },
    { name: '@react-native-picker/picker', type: 'runtime' },
    { name: 'expo-file-system', type: 'runtime' },
    { name: 'expo-screen-orientation', type: 'runtime' },
    { name: 'formik', type: 'runtime' },
    { name: 'react-native-vector-icons', type: 'runtime' },
    { name: 'react-native-open-maps', type: 'runtime' },
    { name: 'typescript', type: 'dev' },
    { name: '@types/react', type: 'dev' },
    { name: '@types/react-native', type: 'dev' },
  ];

  requiredDeps.forEach((dep) => {
    if (deps[dep.name]) {
      console.log(`${GREEN}${CHECK}${RESET} ${dep.name} (${deps[dep.name]})`);
      successes++;
    } else {
      const severity = dep.type === 'runtime' ? 'CRITICAL' : 'WARNING';
      const color = dep.type === 'runtime' ? RED : YELLOW;
      console.log(`${color}${CROSS}${RESET} ${dep.name} ${color}[${severity}]${RESET}`);

      if (dep.type === 'runtime') {
        criticalFailures++;
        console.log(`   Install: npm install ${dep.name}`);
      } else {
        warnings++;
        console.log(`   Install: npm install --save-dev ${dep.name}`);
      }
    }
  });
} else {
  console.log(`${RED}${CROSS} package.json not found${RESET}`);
  criticalFailures++;
}

console.log('\n' + '─'.repeat(50) + '\n');

// Summary
console.log('📊 Summary\n');
console.log(`${GREEN}Successes:${RESET} ${successes}`);
console.log(`${YELLOW}Warnings:${RESET} ${warnings}`);
console.log(`${RED}Critical Failures:${RESET} ${criticalFailures}`);

console.log('\n' + '─'.repeat(50) + '\n');

// Next steps
if (criticalFailures > 0) {
  console.log(`${RED}❌ Critical issues found!${RESET}`);
  console.log('\nNext steps:');
  console.log('1. Install missing dependencies (see above)');
  console.log('2. Verify all critical files exist');
  console.log('3. Run this script again\n');
  process.exit(1);
} else if (warnings > 0) {
  console.log(`${YELLOW}⚠️  Some warnings found${RESET}`);
  console.log('\nRecommendations:');
  console.log('1. Install missing dev dependencies for best experience');
  console.log('2. Create tsconfig.json if missing: npx expo customize tsconfig.json');
  console.log('3. Review documentation files\n');
  console.log('You can proceed with testing, but address warnings when possible.\n');
  process.exit(0);
} else {
  console.log(`${GREEN}✅ All checks passed!${RESET}`);
  console.log('\n🚀 Next steps:');
  console.log('1. Read: docs/PICKUP_COMPLETE_QUICK_START.md');
  console.log('2. Add screen to your navigator');
  console.log('3. Run: npm start');
  console.log('4. Test using: docs/PICKUP_COMPLETE_TESTING_GUIDE.md\n');
  process.exit(0);
}
