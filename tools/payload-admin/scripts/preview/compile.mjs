import {compilePreview} from './compiler.mjs';
const [inputFile,output,base]=process.argv.slice(2);
try{await compilePreview({inputFile,output,base});}catch{console.error('Private preview compilation failed');process.exitCode=1;}
