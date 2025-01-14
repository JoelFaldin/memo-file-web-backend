import { Controller, Get, Post, UseInterceptors, UploadedFile } from '@nestjs/common';

import { ExcelService } from './excel.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('excel')
export class ExcelController {
  constructor(private readonly excelService: ExcelService) {}

  @Post()
  @UseInterceptors(FileInterceptor('excel'))
  async create(@UploadedFile() file: Express.Multer.File) {
    return this.excelService.create(file);
  }

  @Get()
  find() {
    return this.excelService.find();
  }
}
