import { Module } from '@nestjs/common';

import { ExcelController } from './excel.controller';
import { ExcelService } from './excel.service';
import { PrismaService } from 'src/prisma.service';
import { StringsModule } from 'src/strings/strings.module';

@Module({
  controllers: [ExcelController],
  exports: [ExcelService],
  providers: [ExcelService, PrismaService],
  imports: [StringsModule]
})
export class ExcelModule {}
