import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {approvedContentPlugin} from '../approved-content-vite.mjs';
import path from 'node:path';
export default defineConfig({plugins:[react(),approvedContentPlugin({repoRoot:path.resolve(import.meta.dirname,'../../..')})],server:{host:'127.0.0.1',port:4189,strictPort:true},build:{outDir:'dist'}});
