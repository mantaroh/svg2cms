import path from "path";
import fs from "fs";
import { generateHTML } from "./openai/index.js";

// SVG File path
const argFile = process.argv[2];
const svgPath = path.resolve(argFile);

// read svg file and store it in svgContent as string
const svgContent = await fs.promises.readFile(svgPath, 'utf-8');
console.log(svgContent);
const html = await generateHTML(svgContent);

console.log(html);