import path from "path";
import fs from "fs";
import { detectCmsArea, detectCmsAreaFromHTML, generateHTML, replaceEmbedSyntax } from "./openai/index.js";
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

    if ([".html", ".htm"].indexOf(extension) === -1 || !fs.existsSync(filePath)) {
        console.error("Invalid file path or format. Please provide a valid html file path.");
        exit(1);
    }
    
    const rawHtml = fs.readFileSync(filePath, 'utf8');

    console.log("🚀🚀🚀Detecting CMS Area");
    const cmsInfo = JSON.parse(await detectCmsAreaFromHTML(rawHtml));
    console.log(JSON.stringify(cmsInfo));
    fs.writeFileSync("cms-info_exp1.json", JSON.stringify(cmsInfo));

    console.log("🎉Success🎉");
} catch(e) {
    console.error(e);
    exit(1);
} finally {
    if (r2Uploaded) {
        await removeFile(key);
    }
    // remove png file
    fs.unlinkSync(pngPath);
}

exit(0);
