import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LocalUploadService } from "./local-upload.service";
import { UploadService } from "./upload.service";
import { CloudinaryUploadService } from "./cloudinary-upload.service";

@Module({
  imports: [ConfigModule],
  providers: [
    UploadService,
    CloudinaryUploadService,
    LocalUploadService,
  ],
  exports: [UploadService],
})
export class UploadModule {}
