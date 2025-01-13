import { Controller, Get, Post, Body } from '@nestjs/common';

import { CreateExcelDto } from './dto/create-excel.dto';
import { ExcelService } from './excel.service';

@Controller('excel')
export class ExcelController {
  constructor(private readonly excelService: ExcelService) {}

  @Post()
  create(@Body() createExcelDto: CreateExcelDto) {
    return this.excelService.create(createExcelDto);
  }

  @Get()
  find() {
    return this.excelService.find();
  }
}
