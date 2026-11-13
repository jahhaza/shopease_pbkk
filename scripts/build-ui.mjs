import {build} from 'esbuild';import fs from 'node:fs';
await build({entryPoints:['frontend-entry.tsx'],bundle:true,minify:true,format:'iife',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},outfile:'public/assets/shopease.js'});
fs.writeFileSync('public/assets/shopease.css',fs.readFileSync('frontend/shopease.css','utf8').replace("@import 'tailwindcss';",''));
console.log('UI built. Serve the CodeIgniter public directory.');
