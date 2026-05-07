import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  IsEnum,
} from "class-validator";
import { ExpenseCategory } from "@prisma/client";

export class CreateExpenseDto {
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsEnum(ExpenseCategory)
  @IsNotEmpty()
  category: ExpenseCategory;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateExpenseDto {
  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsEnum(ExpenseCategory)
  @IsOptional()
  category?: ExpenseCategory;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
