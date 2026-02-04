import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { LocalUploadService } from "./local-upload.service";
import { CloudinaryUploadService } from "./cloudinary-upload.service";

@Injectable()
export class UploadService {
    constructor(
      private readonly cloudinary: CloudinaryUploadService,
      private readonly local: LocalUploadService,
      private readonly config: ConfigService,
    ) {}

    upload(file: Express.Multer.File, folder: "barbers" | "services" | "shops", publicId: string) {
      const provider = this.config.get<string>("UPLOAD_PROVIDER");

      if (provider === "cloudinary") {
        return this.cloudinary.upload(file, folder, publicId);
      }

      return this.local.upload(file, folder);
    }
    delete(imageUrl: string, publicId: string, folder: "barbers" | "services" | "shops") {
      const provider = this.config.get<string>("UPLOAD_PROVIDER");

      if (provider === "cloudinary") {
        return this.cloudinary.deleteByUrl(folder, publicId);
      }

      return this.local.delete(imageUrl);
    }
}
