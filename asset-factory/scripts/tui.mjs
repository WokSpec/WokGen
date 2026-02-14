import inquirer from 'inquirer';
import figlet from 'figlet';
import { execSync } from 'child_process';

console.clear();
console.log(figlet.textSync('Asset Factory', { horizontalLayout: 'full' }));
console.log('Welcome to the Pixel Art Asset Factory!');
console.log('Generate pixel art assets using free cloud AI.\n');

const menu = async () => {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        'Generate Prompts',
        'Generate Images',
        'Normalize Assets',
        'Package Assets',
        'Validate Assets',
        'Build Registry',
        'Run Full Pipeline',
        'Exit'
      ]
    }
  ]);

  switch (answers.action) {
    case 'Generate Prompts':
      console.log('Generating prompts...');
      execSync('npm run prompts -- --count 10', { stdio: 'inherit' });
      break;
    case 'Generate Images':
      console.log('Generating images (requires REPLICATE_API_TOKEN)...');
      execSync('npm run gen', { stdio: 'inherit' });
      break;
    case 'Normalize Assets':
      console.log('Normalizing assets...');
      execSync('npm run normalize', { stdio: 'inherit' });
      break;
    case 'Package Assets':
      console.log('Packaging assets...');
      execSync('npm run package', { stdio: 'inherit' });
      break;
    case 'Validate Assets':
      console.log('Validating assets...');
      execSync('npm run validate', { stdio: 'inherit' });
      break;
    case 'Build Registry':
      console.log('Building registry...');
      execSync('npm run registry', { stdio: 'inherit' });
      break;
    case 'Run Full Pipeline':
      console.log('Running full pipeline...');
      execSync('npm run all', { stdio: 'inherit' });
      break;
    case 'Exit':
      console.log('Goodbye!');
      return;
  }

  console.log('\n--- Operation completed ---\n');
  await menu(); // Loop back to menu
};

menu().catch(console.error);