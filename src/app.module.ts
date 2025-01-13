import { Module } from '@nestjs/common';

import { ExcelModule } from './excel/excel.module';
import { PrismaService } from './prisma.service';

@Module({
  imports: [ExcelModule],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
