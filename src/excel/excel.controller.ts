import { Controller, Get, Post, UseInterceptors, UploadedFile, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { ExcelService } from './excel.service';

@Controller('excel')
export class ExcelController {
  constructor(private readonly excelService: ExcelService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('excel'))
  async create(@UploadedFile() file: Express.Multer.File) {
    return this.excelService.create(file);
  }

  @Get()
  find() {
    return this.excelService.find();
  }
}
