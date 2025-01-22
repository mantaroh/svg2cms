// @ts-ignore
import { default as Converter } from "convert-svg-to-png";
import path from "path";

export const convertSVGToPNG = async (svgPath: string): Promise<string> => {
    console.log("🚀Converting SVG to PNG");
    const svg = path.resolve(svgPath);
    return await Converter.convertFile(svg);
}
