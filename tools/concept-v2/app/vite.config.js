import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {approvedContentPlugin} from '../approved-content-vite.mjs';
import path from 'node:path';
export default defineConfig(({mode})=>({plugins:[react(),...(mode==='production-release'?[{name:'release-entry',transformIndexHtml:{order:'pre',handler:html=>html.replace('/src/main.jsx','/src/main-release.jsx')}}]:[]),approvedContentPlugin({repoRoot:path.resolve(import.meta.dirname,'../../..')})],server:{host:'127.0.0.1',port:4189,strictPort:true},build:{outDir:'dist'}}));
