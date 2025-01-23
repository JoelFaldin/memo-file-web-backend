import { Module } from '@nestjs/common';

import { ExcelModule } from './excel/excel.module';
import { PrismaService } from './prisma.service';
import { MemoModule } from './memo/memo.module';
import { StringsModule } from './strings/strings.module';

@Module({
  imports: [ExcelModule, MemoModule, StringsModule],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
