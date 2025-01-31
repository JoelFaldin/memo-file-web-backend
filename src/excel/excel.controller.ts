import { Controller, Get, Post, UseInterceptors, UploadedFile, StreamableFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createReadStream } from 'node:fs';
import { Response } from 'express';
import { join } from 'node:path';

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
  getTemplate(): StreamableFile {
    const file = createReadStream(join(process.cwd(), './public/excel_template.xlsx'));
    return new StreamableFile(file, {
      type: 'application/octet-stream',
      disposition: 'attachment; filename="excel_template.xlsx"',
    });
  }

  @Get('data')
  getExcelData(@Res() res: Response) {
    return this.excelService.downloadData(res);
  }
}
