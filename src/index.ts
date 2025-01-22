import path from "path";
import fs from "fs";
import { detectCmsArea, generateHTML, replaceEmbedSyntax } from "./openai/index.js";
import { convertSVGToPNG } from "./utils/svg2png.js";
import { exit } from "process";
import { getSignedUrlForUpload, removeFile, uploadFile } from "./cloudflare/r2.js";

let pngPath = "";
let r2Uploaded = false;
let key = "";

try {
    const argFile = process.argv[2];
    const filePath = path.resolve(argFile);
    const extension = path.extname(filePath);

    if ([".png", ".svg"].indexOf(extension) === -1 || !fs.existsSync(filePath)) {
        console.error("Invalid file path or format. Please provide a valid png or svg file path.");
        exit(1);
    }

    const pngPath = extension === ".svg" ? await convertSVGToPNG(filePath) : filePath;
    console.log(`🚀Converted to PNG: ${pngPath}`);
    key = path.relative(process.cwd(), pngPath);
    const pngBuffer = fs.readFileSync(pngPath);
    
    console.log("🚀Uploading to Cloudflare R2");
    await uploadFile(key, pngBuffer);
    r2Uploaded = true;
    const url = await getSignedUrlForUpload(key);
    console.log(url);

    console.log("🚀🚀Generating HTML");
    const html = await generateHTML(url);
    fs.writeFileSync("raw-html_exp1.html", html);

    console.log("🚀🚀🚀Detecting CMS Area");
    const cmsInfo = JSON.parse(await detectCmsArea(url));
    console.log(JSON.stringify(cmsInfo));
    fs.writeFileSync("cms-info_exp1.json", JSON.stringify(cmsInfo));

    console.log("🚀🚀🚀🚀Replacing Embed Syntax.");
    const replacedHtml = await replaceEmbedSyntax(html.replace(/^```html|```$/g, ''), cmsInfo);
    fs.writeFileSync("output_exp1.html", replacedHtml);

    console.log("🎉Success🎉");
} catch(e) {
    exit(1);
} finally {
    if (r2Uploaded) {
        await removeFile(key);
    }
    // remove png file
    fs.unlinkSync(pngPath);
}

exit(0);