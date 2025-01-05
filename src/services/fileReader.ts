import * as fs from 'fs';
import path from "path";

export const readFile = async (paths: string[]) => {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname, ...paths), 'utf8', (err, data) => {
            if (err) {
                reject(err)
            }
            resolve(JSON.parse(data))
        });
    })
}