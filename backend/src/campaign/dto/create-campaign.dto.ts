import { DiscountType } from "@prisma/client";
import { ArrayNotEmpty, IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateCampaignDto {
    @IsNotEmpty()
    @IsString()
    name: string

    @IsOptional()
    @IsString()
    description: string

    @IsNotEmpty()
    @IsEnum(DiscountType)
    discountType: DiscountType

    @IsOptional()
    @IsNumber()
    discountValue: string

    @IsArray()
    @ArrayNotEmpty()
    @IsInt({ each: true })
    serviceIds: number[]

    @IsNotEmpty()
    @IsDateString()
    startAt: Date

    @IsOptional()
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
