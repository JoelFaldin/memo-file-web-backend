import { Module } from '@nestjs/common';

import { ExcelModule } from './excel/excel.module';
import { PrismaService } from './prisma.service';
import { MemoModule } from './memo/memo.module';

@Module({
  imports: [ExcelModule, MemoModule],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
