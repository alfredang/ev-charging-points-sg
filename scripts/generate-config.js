/**
 * Build script to generate config.js from environment variables
 * Run during Vercel build process
 */

import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const configContent = `/**
 * Configuration file for API keys
 * Auto-generated during build - DO NOT EDIT
 */

window.CONFIG_KEYS = {
    GOOGLE_MAPS_API_KEY: '${process.env.GOOGLE_MAPS_API_KEY || ''}',
    LTA_API_KEY: '${process.env.LTA_API_KEY || ''}'
};
`;

const outputPath = join(__dirname, '..', 'config.js');
writeFileSync(outputPath, configContent);
console.log('Generated config.js');
