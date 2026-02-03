import { IsOptional, IsString } from "class-validator";

export class UpdateShopDto {
    @IsOptional()
    @IsString()
    name: string

    @IsOptional()
    @IsString()
    city: string

    @IsOptional()
    @IsString()
    district: string

    @IsOptional()
    @IsString()
    neighborhood: string

    @IsOptional()
    @IsString()
    address: string

    @IsOptional()
    @IsString()
    phone: string
}