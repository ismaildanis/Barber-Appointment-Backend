import { Injectable } from "@nestjs/common";
import cloudinary from "./cloudinary.config";

@Injectable()
export class CloudinaryUploadService {
    async upload(file: Express.Multer.File, folder: string) {
        return new Promise<{ url: string }>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
            folder: `berber-randevum/${folder}`,
            resource_type: "image",
            },
            (error, result) => {
                if (error) return reject(error);

                if (!result) {
                    return reject(new Error("Cloudinary upload failed: result is undefined"));
                }        

                resolve({ url: result.secure_url });
            }
        ).end(file.buffer);
        });
    }

    async deleteByUrl(imageUrl: string) {
        const parts = imageUrl.split("/");
        const filename = parts.pop();
        const folder = parts.slice(parts.indexOf("upload") + 1, parts.length - 1).join("/");
        const publicId = `${folder}/${filename?.split(".")[0]}`;

        await cloudinary.uploader.destroy(publicId);
    }
}
