import * as fs from 'fs';
import path from "path";

export const writeFile = async (paths: string[], data: object) => {
    // Write the memory to a JSON file
    const outputPath = path.join(__dirname, ...paths)
    // save data to json files
    try {
        fs.mkdirSync(path.dirname(outputPath), {recursive: true}); // Ensure the directory exists
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error: any) {
        console.error(`Failed to write to file: ${error.message}`);
    }
}