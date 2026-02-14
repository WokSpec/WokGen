import inquirer from 'inquirer';
import figlet from 'figlet';
import { execSync } from 'child_process';
import { readdirSync } from 'fs';

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
        'View Assets',
        'About',
        'Exit'
      ]
    }
  ]);

  switch (answers.action) {
    case 'Generate Prompts':
      await generatePrompts();
      break;
    case 'Generate Images':
      await generateImages();
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
    case 'View Assets':
      await viewAssets();
      break;
    case 'About':
      console.log('\nAsset Factory v1.0.0');
      console.log('A cloud-based pixel art asset generator using free AI APIs.');
      console.log('Built with Node.js and Replicate.\n');
      break;
    case 'Exit':
      console.log('Goodbye!');
      return;
  }

  if (answers.action !== 'About') {
    console.log('\n--- Operation completed ---\n');
  }
  await menu(); // Loop back to menu
};

const generatePrompts = async () => {
  const promptAnswers = await inquirer.prompt([
    {
      type: 'input',
      name: 'count',
      message: 'How many prompts to generate?',
      default: 10,
      validate: (input) => !isNaN(input) && input > 0 ? true : 'Please enter a positive number'
    },
    {
      type: 'input',
      name: 'category',
      message: 'Category filter (leave blank for all):',
      default: ''
    }
  ]);

  const cmd = `npm run prompts -- --count ${promptAnswers.count}${promptAnswers.category ? ` --category ${promptAnswers.category}` : ''}`;
  console.log(`Generating ${promptAnswers.count} prompts${promptAnswers.category ? ` for ${promptAnswers.category}` : ''}...`);
  execSync(cmd, { stdio: 'inherit' });
};

const generateImages = async () => {
  if (!process.env.REPLICATE_API_TOKEN) {
    console.log('Error: REPLICATE_API_TOKEN not set. Please set it in your environment.');
    return;
  }
  console.log('Generating images...');
  execSync('npm run gen', { stdio: 'inherit' });
};

const viewAssets = async () => {
  const dirs = ['assets/rendered/icons/32', 'assets/rendered/icons/64', 'assets/rendered/icons/128'];
  for (const dir of dirs) {
    try {
      const files = readdirSync(dir).filter(f => f.endsWith('.png')).slice(0, 5);
      console.log(`\n${dir}:`);
      files.forEach(f => console.log(`  - ${f}`));
    } catch (e) {
      console.log(`\n${dir}: (empty or not found)`);
    }
  }
  console.log('\nRun "ls assets/rendered/icons/32" for full list.\n');
};

menu().catch(console.error);