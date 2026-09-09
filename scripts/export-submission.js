import fs from 'fs';
import path from 'path';

const filesToExport = [
  'index.html',
  'src/App.tsx',
  'src/utils/nexusEngine.ts',
  'src/utils/localVault.ts',
  'src/utils/authService.ts',
  'src/utils/notificationService.ts',
  'src/utils/indexedDbService.ts',
  'public/form-check.js',
  'public/sw.js',
  'public/manifest.webmanifest',
  'metadata.json'
];

let submissionText = `================================================================================
NEXUS — THE LONGEVITY WEB (STANDALONE SUBMISSION CODE)
================================================================================\n\n`;

for (const relPath of filesToExport) {
  const fullPath = path.resolve(process.cwd(), relPath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    submissionText += `\n===== FILE: ${relPath} =====\n\n${content}\n\n`;
  } else {
    console.warn(`File not found: ${relPath}`);
  }
}

fs.writeFileSync(path.resolve(process.cwd(), 'submission-code.txt'), submissionText, 'utf8');
console.log('Successfully generated submission-code.txt');
