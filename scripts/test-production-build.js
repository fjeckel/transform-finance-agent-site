#!/usr/bin/env node

/**
 * Production Build Test Script
 * Tests the production build for common issues that don't appear in development
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BUILD_DIR = path.join(__dirname, '..', 'dist');
const CRITICAL_FILES = [
  'index.html',
  'manifest.json',
  'assets',
];

const CRITICAL_JS_PATTERNS = [
  /executeClaudeResearch/g,
  /researchService/g,
  /useResearchService/g,
];

const PROBLEMATIC_PATTERNS = [
  /\bundefined\s*\(/g, // undefined function calls
  /Cannot read property.*of undefined/g,
  /\w+ is not a function/g,
  /Module not found/g,
];

function log(level, message) {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    warning: '\x1b[33m',
    error: '\x1b[31m',
    reset: '\x1b[0m'
  };
  
  console.log(`${colors[level] || ''}[${level.toUpperCase()}] ${message}${colors.reset}`);
}

function checkBuildExists() {
  log('info', 'Checking if build directory exists...');
  
  if (!fs.existsSync(BUILD_DIR)) {
    log('error', 'Build directory does not exist. Run npm run build first.');
    return false;
  }
  
  for (const file of CRITICAL_FILES) {
    const filePath = path.join(BUILD_DIR, file);
    if (!fs.existsSync(filePath)) {
      log('error', `Critical file missing: ${file}`);
      return false;
    }
  }
  
  log('success', 'Build directory and critical files exist');
  return true;
}

function checkJavaScriptBundles() {
  log('info', 'Checking JavaScript bundles...');
  
  const assetsDir = path.join(BUILD_DIR, 'assets');
  const jsFiles = fs.readdirSync(assetsDir).filter(file => file.endsWith('.js'));
  
  if (jsFiles.length === 0) {
    log('error', 'No JavaScript files found in assets directory');
    return false;
  }
  
  let hasIssues = false;
  
  for (const jsFile of jsFiles) {
    const filePath = path.join(assetsDir, jsFile);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for problematic patterns
    for (const pattern of PROBLEMATIC_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        log('warning', `Found ${matches.length} potential issues in ${jsFile}: ${pattern}`);
        hasIssues = true;
      }
    }
    
    // Check if ResearchWizard bundle has required functions
    if (jsFile.includes('ResearchWizard')) {
      log('info', `Checking ResearchWizard bundle: ${jsFile}`);
      
      for (const pattern of CRITICAL_JS_PATTERNS) {
        if (!content.match(pattern)) {
          log('warning', `ResearchWizard bundle missing pattern: ${pattern}`);
          hasIssues = true;
        }
      }
    }
  }
  
  if (!hasIssues) {
    log('success', 'JavaScript bundles look good');
  }
  
  return !hasIssues;
}

function checkManifest() {
  log('info', 'Checking manifest.json...');
  
  const manifestPath = path.join(BUILD_DIR, 'manifest.json');
  
  try {
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);
    
    const requiredFields = ['name', 'short_name', 'start_url', 'display'];
    const missingFields = requiredFields.filter(field => !manifest[field]);
    
    if (missingFields.length > 0) {
      log('warning', `Manifest missing fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    log('success', 'Manifest.json is valid');
    return true;
  } catch (error) {
    log('error', `Error reading manifest.json: ${error.message}`);
    return false;
  }
}

function checkIndexHtml() {
  log('info', 'Checking index.html...');
  
  const indexPath = path.join(BUILD_DIR, 'index.html');
  const content = fs.readFileSync(indexPath, 'utf8');
  
  // Check for required elements
  const requiredElements = [
    /<div id="root">/,
    /<script.*src.*assets.*\.js.*>/,
    /<link.*href.*assets.*\.css.*>/,
  ];
  
  let hasIssues = false;
  
  for (const pattern of requiredElements) {
    if (!content.match(pattern)) {
      log('warning', `Index.html missing pattern: ${pattern}`);
      hasIssues = true;
    }
  }
  
  if (!hasIssues) {
    log('success', 'index.html looks good');
  }
  
  return !hasIssues;
}

function runBuildTest() {
  log('info', 'Starting production build test...');
  
  const checks = [
    { name: 'Build exists', fn: checkBuildExists },
    { name: 'JavaScript bundles', fn: checkJavaScriptBundles },
    { name: 'Manifest', fn: checkManifest },
    { name: 'Index HTML', fn: checkIndexHtml },
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    try {
      const result = check.fn();
      if (!result) {
        allPassed = false;
      }
    } catch (error) {
      log('error', `Check "${check.name}" failed: ${error.message}`);
      allPassed = false;
    }
  }
  
  if (allPassed) {
    log('success', 'All production build tests passed!');
    process.exit(0);
  } else {
    log('error', 'Some production build tests failed. Please review the issues above.');
    process.exit(1);
  }
}

// Add this script to package.json scripts
function updatePackageJson() {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (!packageJson.scripts['test:build']) {
      packageJson.scripts['test:build'] = 'node scripts/test-production-build.js';
      packageJson.scripts['build:test'] = 'npm run build && npm run test:build';
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      log('info', 'Added test:build and build:test scripts to package.json');
    }
  } catch (error) {
    log('warning', `Could not update package.json: ${error.message}`);
  }
}

if (require.main === module) {
  updatePackageJson();
  runBuildTest();
}

module.exports = {
  checkBuildExists,
  checkJavaScriptBundles,
  checkManifest,
  checkIndexHtml,
  runBuildTest
};