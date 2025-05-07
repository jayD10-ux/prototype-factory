
/**
 * This is a utility file to help diagnose Vite installation issues
 * You can run this file with: node src/utils/vite-check.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Check if package.json exists
const pkgPath = path.resolve(process.cwd(), 'package.json');
if (!fs.existsSync(pkgPath)) {
  console.error('Error: package.json not found in the current directory');
  process.exit(1);
}

// Read package.json
try {
  const pkgContent = fs.readFileSync(pkgPath, 'utf8');
  const pkg = JSON.parse(pkgContent);
  
  console.log('=== Package Information ===');
  console.log(`Name: ${pkg.name}`);
  console.log(`Version: ${pkg.version}`);
  
  // Check if vite is in dependencies
  console.log('\n=== Vite Status ===');
  if (pkg.dependencies?.vite) {
    console.log(`Vite found in dependencies: ${pkg.dependencies.vite}`);
  } else if (pkg.devDependencies?.vite) {
    console.log(`Vite found in devDependencies: ${pkg.devDependencies.vite}`);
  } else {
    console.error('Error: Vite not found in dependencies or devDependencies');
    console.log('Please install Vite: npm install vite --save-dev');
  }
  
  // Check scripts
  console.log('\n=== Scripts ===');
  if (pkg.scripts?.dev?.includes('vite')) {
    console.log(`Dev script found: ${pkg.scripts.dev}`);
  } else {
    console.error('Error: No "dev" script with vite found');
    console.log('Recommended dev script: "vite"');
  }
  
  // Check if vite.config.js/ts exists
  console.log('\n=== Config Files ===');
  const configFiles = ['vite.config.js', 'vite.config.ts'].filter(file => 
    fs.existsSync(path.resolve(process.cwd(), file))
  );
  
  if (configFiles.length > 0) {
    console.log(`Config files found: ${configFiles.join(', ')}`);
  } else {
    console.error('Error: No vite.config.js or vite.config.ts found');
  }
  
  console.log('\nIf all checks passed, try running: npm install && npm run dev');
  
} catch (error) {
  console.error('Error parsing package.json:', error);
}
