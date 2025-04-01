
/**
 * Scripts for deploying to staging and production environments
 */
const { spawn } = require('child_process');
const chalk = require('chalk');

// Execute command and return promise
function execute(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(chalk.blue(`> ${command} ${args.join(' ')}`));
    
    const process = spawn(command, args, { 
      stdio: 'inherit',
      ...options
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    process.on('error', (err) => {
      reject(err);
    });
  });
}

// Deploy to staging environment
async function deployToStaging() {
  console.log(chalk.green('🚀 Deploying to STAGING environment...'));
  
  try {
    console.log(chalk.yellow('Building for staging...'));
    await execute('npm', ['run', 'build:staging']);

    console.log(chalk.yellow('Deploying to Cloudflare Pages...'));
    await execute('npx', ['wrangler', 'pages', 'deploy', 'dist', '--project-name=prototype-app-staging', '--branch=staging']);
    
    console.log(chalk.green('✅ Successfully deployed to STAGING environment!'));
  } catch (error) {
    console.error(chalk.red('❌ Staging deployment failed:'), error);
    process.exit(1);
  }
}

// Deploy to production environment
async function deployToProduction() {
  console.log(chalk.green('🚀 Promoting to PRODUCTION environment...'));
  
  try {
    console.log(chalk.yellow('Building for production...'));
    await execute('npm', ['run', 'build:production']);
    
    console.log(chalk.yellow('Deploying to Cloudflare Pages...'));
    await execute('npx', ['wrangler', 'pages', 'deploy', 'dist', '--project-name=prototype-app', '--branch=production']);
    
    console.log(chalk.green('✅ Successfully deployed to PRODUCTION environment!'));
  } catch (error) {
    console.error(chalk.red('❌ Production deployment failed:'), error);
    process.exit(1);
  }
}

// Handle command line arguments
const [, , command] = process.argv;

if (command === 'staging') {
  deployToStaging();
} else if (command === 'production') {
  deployToProduction();
} else {
  console.log(`
Usage: node deploy-commands.js [command]

Commands:
  staging     Build and deploy to staging environment
  production  Build and deploy to production environment
  `);
}
