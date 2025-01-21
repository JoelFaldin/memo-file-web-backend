import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateMemoDto {
    @IsString()
    @IsNotEmpty()
    tipo: string;

    @IsString()
    @IsNotEmpty()
    patente: string;

    @IsString()
    @IsNotEmpty()
    rut: string;

    @IsString()
    @IsNotEmpty()
    nombre: string;

    @IsString()
    @IsNotEmpty()
    calle: string;

    @IsString()
    @IsOptional()
    numero: string;

    @IsString()
    @IsOptional()
    aclaratoria: string;

    @IsString()
    @IsNotEmpty()
    periodo: string;

    @IsNumber()
    @IsNotEmpty()
    capital: number;

    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    @Max(100)
    afecto: number;

    @IsNumber()
    @IsNotEmpty()
    total: number;

    @IsInt()
    @IsNotEmpty()
    emision: number;

    @IsNumber()
    @IsNotEmpty()
    fechaPagos: number;

    @IsString()
    @IsNotEmpty()
    giro: string;

    @IsString()
    @IsOptional()
    agtp: string;
}