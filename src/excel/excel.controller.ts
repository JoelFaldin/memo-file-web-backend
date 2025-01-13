import { Controller, Get, Post, Body, UseInterceptors, UploadedFile } from '@nestjs/common';

import { CreateExcelDto } from './dto/create-excel.dto';
import { ExcelService } from './excel.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('excel')
export class ExcelController {
  constructor(private readonly excelService: ExcelService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(@UploadedFile() file: Express.Multer.File) {
    return this.excelService.create(file);
  }

  @Get()
  find() {
    return this.excelService.find();
  }
}
