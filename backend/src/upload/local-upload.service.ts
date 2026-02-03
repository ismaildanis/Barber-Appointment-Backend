import { Injectable } from "@nestjs/common";
import * as fs from 'fs';
import path from "path";

@Injectable()
export class LocalUploadService {
    async upload(file: Express.Multer.File, folder: string) {
        const filename = `${Date.now()}-${file.originalname}`;
        fs.mkdirSync("uploads", { recursive: true });
        fs.writeFileSync(`uploads/${folder}/${filename}`, file.buffer);

        return { url: `/uploads/${filename}` };
    }
    async delete(imageUrl: string) {
        const filePath = path.join(process.cwd(), imageUrl);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }

}
