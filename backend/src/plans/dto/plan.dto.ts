import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
} from "class-validator";
import { PlanStatus as PrismaPlanStatus } from "@prisma/client";

export type PlanStatus = PrismaPlanStatus;

export class CreatePlanDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  destinationCity: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsNumber()
  @IsNotEmpty()
  budget: number;

  @IsString()
  @IsOptional()
  coverImage?: string;

  @IsEnum(PrismaPlanStatus)
  @IsOptional()
  status?: PlanStatus;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}

export class UpdatePlanDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  destinationCity?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @IsOptional()
  budget?: number;

  @IsString()
  @IsOptional()
  coverImage?: string;

  @IsEnum(PrismaPlanStatus)
  @IsOptional()
  status?: PlanStatus;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
