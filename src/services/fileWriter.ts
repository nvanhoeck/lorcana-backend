import * as fs from 'fs';
import path from "path";

export const writeFile = async (paths: string[], data: object, overwrite: boolean = true) => {
    const outputPath = path.join(__dirname, ...paths);

    try {
        // Ensure the directory exists
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });

        if (overwrite || !fs.existsSync(outputPath)) {
            // Overwrite or write the file if it doesn't exist
            fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
        } else {
            // Append to the existing file
            const existingData = fs.readFileSync(outputPath, 'utf-8');
            const combinedData = {
                ...JSON.parse(existingData),
                ...data
            };
            fs.writeFileSync(outputPath, JSON.stringify(combinedData, null, 2), 'utf-8');
        }
    } catch (error: any) {
        console.error(`Failed to write to file: ${error.message}`);
    }
};
