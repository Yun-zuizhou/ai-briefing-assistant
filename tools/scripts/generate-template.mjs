import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { rootDir } from './_shared.mjs';

const templateRoot = path.join(rootDir, 'tools/templates');
const manifestPath = path.join(templateRoot, 'manifest.json');

function printUsage() {
  console.log([
    'Usage:',
    '  node tools/scripts/generate-template.mjs <set-id> --Feature Name --feature name [--domain name] [--RouteBase /path] [--dry-run] [--force]',
    '',
    'Examples:',
    '  node tools/scripts/generate-template.mjs page --Feature Growth --feature growth --dry-run',
    '  node tools/scripts/generate-template.mjs worker-route-service --Feature Growth --feature growth --domain preferences --RouteBase /growth --dry-run',
  ].join('\n'));
}

function parseArgs(argv) {
  const [setId, ...rest] = argv;
  const options = {
    setId,
    replacements: {},
    dryRun: false,
    force: false,
  };

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    if (arg === '--force') {
      options.force = true;
      continue;
    }
    if (!arg.startsWith('--')) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    const key = arg.slice(2);
    const value = rest[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for ${arg}`);
    }
    index += 1;

    const tokenName = key === 'RouteBase' ? '__RouteBase__' : `__${key}__`;
    options.replacements[tokenName] = value;
  }

  return options;
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

function applyReplacements(text, replacements) {
  return Object.entries(replacements).reduce((current, [token, value]) => {
    return current.split(token).join(value);
  }, text);
}

function findUnresolvedTokens(text) {
  return Array.from(new Set(text.match(/__[A-Za-z]+__/g) || [])).sort();
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.setId || options.setId === '--help' || options.setId === '-h') {
    printUsage();
    return;
  }

  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const templateSet = manifest.sets.find((item) => item.id === options.setId);
  if (!templateSet) {
    const ids = manifest.sets.map((item) => item.id).join(', ');
    throw new Error(`Unknown template set "${options.setId}". Available sets: ${ids}`);
  }

  const missingTokens = templateSet.requiredTokens.filter((token) => !options.replacements[token]);
  if (missingTokens.length > 0) {
    throw new Error(`Missing required replacement token values: ${missingTokens.join(', ')}`);
  }

  const generatedFiles = [];
  for (const file of templateSet.files) {
    const templatePath = path.join(templateRoot, file.template);
    const outputRelativePath = applyReplacements(file.output, options.replacements);
    const outputPath = path.join(rootDir, outputRelativePath);
    const templateText = await readFile(templatePath, 'utf8');
    const outputText = applyReplacements(templateText, options.replacements);
    const unresolvedTokens = findUnresolvedTokens(outputText);

    if (unresolvedTokens.length > 0) {
      throw new Error(`${file.template} still contains unresolved tokens: ${unresolvedTokens.join(', ')}`);
    }
    if (!options.force && await exists(outputPath)) {
      throw new Error(`Refusing to overwrite existing file: ${outputRelativePath}. Pass --force to overwrite.`);
    }

    generatedFiles.push({
      outputPath,
      outputRelativePath,
      outputText,
    });
  }

  for (const file of generatedFiles) {
    if (!options.dryRun) {
      await mkdir(path.dirname(file.outputPath), { recursive: true });
      await writeFile(file.outputPath, file.outputText, 'utf8');
    }
    console.log(`${options.dryRun ? 'would create' : 'created'} ${file.outputRelativePath}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
