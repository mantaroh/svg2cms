import path from "path";
import fs from "fs";
import { detectCmsArea, generateHTML } from "./openai/index.js";
import { convertSVGToPNG } from "./utils/svg2png.js";
import { exit } from "process";
import { getSignedUrlForUpload, removeFile, uploadFile } from "./cloudflare/r2.js";

let pngPath = "";
let r2Uploaded = false;

try {
    // SVG File path
    const argFile = process.argv[2];
    const svgPath = path.resolve(argFile);

    // read svg file and store it in svgContent as string
    pngPath = await convertSVGToPNG(svgPath);
    const key = path.relative(process.cwd(), pngPath);
    console.log(pngPath);
    console.log(key);
    const pngBuffer = fs.readFileSync(pngPath);
    
    console.log("Uploading to R2🚀");
    await uploadFile(key, pngBuffer);
    r2Uploaded = true;
    const url = await getSignedUrlForUpload(key);
    console.log(url);

    console.log("Generating HTML🚀🚀");
    //const html = await generateHTML(url);
    //console.log(html);

    console.log("Detecting CMS Area🚀🚀🚀");
    const cmsInfo = await detectCmsArea(url);
    console.log(cmsInfo);

    await removeFile(key);
} catch(e) {
    console.error(e);
    exit(1);
} finally {
    if (r2Uploaded) {
        await removeFile(pngPath);
    }
    // remove png file
    fs.unlinkSync(pngPath);
}

exit(0);