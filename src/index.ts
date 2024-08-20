import path from "path";
import fs from "fs";
import { detectCmsArea, generateHTML, replaceEmbedSyntax } from "./openai/index.js";
import { convertSVGToPNG } from "./utils/svg2png.js";
import { exit } from "process";
import { getSignedUrlForUpload, removeFile, uploadFile } from "./cloudflare/r2.js";
import { SpearlyAPIClient } from "./spearly/index.js";

let pngPath = "";
let r2Uploaded = false;

try {
    const argFile = process.argv[2];
    const filePath = path.resolve(argFile);
    const extension = path.extname(filePath);

    if (["png", "svg"].indexOf(extension) === -1 || !fs.existsSync(filePath)) {
        console.error("Invalid file path or format. Please provide a valid png or svg file path.");
        exit(1);
    }

    const pngPath = extension === "svg" ? await convertSVGToPNG(filePath) : filePath;
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
    const html = await generateHTML(url);
    fs.writeFileSync("raw-html.html", html);

    console.log("Detecting CMS Area🚀🚀🚀");
    const cmsInfo = JSON.parse(await detectCmsArea(url));
    console.log(JSON.stringify(cmsInfo));
    fs.writeFileSync("cms-info.json", JSON.stringify(cmsInfo));

    console.log("Replacing Embed Syntax🚀🚀🚀🚀");
    const replacedHtml = await replaceEmbedSyntax(html, cmsInfo);
    fs.writeFileSync("output.html", replacedHtml);

    console.log("🎉Success🎉");

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