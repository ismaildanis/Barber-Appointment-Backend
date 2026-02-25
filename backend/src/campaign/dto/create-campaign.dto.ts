import { DiscountType } from "@prisma/client";
import { ArrayNotEmpty, IsArray, IsBoolean, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateCampaignDto {
    @IsNotEmpty()
    @IsString()
    name: string

    @IsOptional()
    @IsString()
    description: string

    @IsNotEmpty()
    @IsString()
    discountType: DiscountType

    @IsOptional()
    @IsString()
    discountValue: string

    @IsArray()
    @ArrayNotEmpty()
    @IsInt({ each: true })
    serviceIds: number[]

    @IsNotEmpty()
    @IsDateString()
    startAt: Date

    @IsNotEmpty()
    @IsDateString()
    endAt: Date

    @IsOptional()
    @IsBoolean()
    wheelEnabled: boolean

    @IsOptional()
    @IsInt()
    wheelWeight: number
    
    @IsOptional()
    @IsBoolean()
    active: boolean
    
}
