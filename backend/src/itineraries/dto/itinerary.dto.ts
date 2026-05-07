import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  IsArray,
  IsEnum,
} from "class-validator";
import { ItemType } from "@prisma/client";

export class CreateItineraryDto {
  @IsNumber()
  @IsOptional()
  dayNumber?: number;

  @IsDateString()
  @IsNotEmpty()
  date: string;
}

export class UpdateItineraryDto {
  @IsNumber()
  @IsOptional()
  dayNumber?: number;

  @IsDateString()
  @IsOptional()
  date?: string;
}

export class CreateItineraryItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsNumber()
  @IsOptional()
  estimatedCost?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsEnum(ItemType)
  @IsNotEmpty()
  type: ItemType;

  @IsString()
  @IsOptional()
  icon?: string;
}

export class UpdateItineraryItemDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsNumber()
  @IsOptional()
  estimatedCost?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsEnum(ItemType)
  @IsOptional()
  type?: ItemType;

  @IsString()
  @IsOptional()
  icon?: string;
}

export class ReorderItemsDto {
  @IsArray()
  @IsNotEmpty()
  itemIds: number[];
}
