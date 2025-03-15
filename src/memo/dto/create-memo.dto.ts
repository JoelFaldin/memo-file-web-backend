import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateMemoDto {
  @IsString()
  @IsNotEmpty({
    message: 'Debes ingresar un tipo de patente.',
  })
  @IsEnum(['COMER', 'PROFE', 'INDUS', 'ALCOH', 'MEF'], {
    message:
      'Tipo de patente no válido. Debe ser COMER, PROFE, INDUS, ALCOH o MEF',
  })
  tipo: string;

  @IsString()
  @IsNotEmpty({
    message: 'Debes ingresar una patente!',
  })
  patente: string;

  @IsString()
  @IsNotEmpty({
    message: 'Debes ingresar un rut.',
  })
  rut: string;

  @IsString()
  @IsNotEmpty({
    message: 'Debes ingresar el nombre de la persona que paga la patente!',
  })
  name: string;

  @IsString()
  @IsNotEmpty({
    message: 'Por favor, ingresa el nombre de la calle.',
  })
  calle: string;

  @IsString()
  @IsOptional()
  numero: string;

  @IsString()
  @IsOptional()
  aclaratoria: string;

  @IsString()
  @IsNotEmpty({
    message: 'Debes ingresar un periodo válido.',
  })
  periodo: string;

  @IsNumber()
  @IsNotEmpty({
    message: 'Debes ingresar un valor válido.',
  })
  capital: number;

  @IsNumber()
  @IsNotEmpty({
    message: 'Debes ingresar un valor válido.',
  })
  @Min(0, {
    message: 'El valor no puede ser negativo.',
  })
  @Max(100, {
    message: 'El valor no puede ser mayor a 100.',
  })
  afecto: number;

  @IsNumber()
  @IsNotEmpty({
    message: 'Debes ingresar el total pagado.',
  })
  total: number;

  @IsInt()
  @IsNotEmpty({
    message: 'Debes ingresar un valor válido.',
  })
  emision: number;

  @IsString()
  @IsNotEmpty({
    message: 'Debes ingresar una fecha!',
  })
  @Matches(/^(0[1-9]|[12]\d|3[01])-(0[1-9]|1[0-2])-(19|20)\d{2}$/, {
    message:
      'Has ingresado una fecha inválida. Debe tener el formato de dd-mm-aaaa.',
  })
  fechaPagos: number;

  @IsString()
  @IsNotEmpty({
    message: 'Debes indicar el giro.',
  })
  giro: string;

  @IsString()
  @IsOptional()
  agtp: string;

  @IsString()
  @IsOptional()
  nombre_representante: string;

  @IsString()
  @IsOptional()
  rut_representante: string;
}
