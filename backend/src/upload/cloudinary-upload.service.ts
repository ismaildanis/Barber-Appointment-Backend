import { Injectable } from "@nestjs/common";
import cloudinary from "./cloudinary.config";

@Injectable()
export class CloudinaryUploadService {
    async upload(file: Express.Multer.File, folder: string, publicId: string) {
        return new Promise<{ url: string }>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                folder: `berber-randevum/${folder}`,
                public_id: publicId,
                overwrite: true,
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

    async deleteByUrl(folder: string, publicId: string) {
        const fullPublicId = `berber-randevum/${folder}/${publicId}`;
        return await cloudinary.uploader.destroy(fullPublicId);
    }
}
