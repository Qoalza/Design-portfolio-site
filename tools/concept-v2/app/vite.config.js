import {startupModulePlugin} from './startup-module-vite.mjs';
import {earlyPreloaderPlugin} from './early-preloader-vite.mjs';
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {approvedContentPlugin} from '../approved-content-vite.mjs';
import path from 'node:path';
export function createPortfolioViteConfig({mode,preparedInput}){return {plugins:[earlyPreloaderPlugin(),react(),startupModulePlugin({release:mode==='production-release'}),...(mode==='production-release'?[{name:'release-entry',transformIndexHtml:{order:'pre',handler:html=>html.replace('/src/main.jsx','/src/main-release.jsx')}}]:[]),approvedContentPlugin({repoRoot:path.resolve(import.meta.dirname,'../../..'),preparedInput})],server:{host:'127.0.0.1',port:4189,strictPort:true},build:{outDir:'dist'}};}
export default defineConfig(({mode})=>createPortfolioViteConfig({mode}));
