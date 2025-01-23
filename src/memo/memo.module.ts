import { Module } from '@nestjs/common';
import { MemoService } from './memo.service';
import { MemoController } from './memo.controller';
import { PrismaService } from 'src/prisma.service';
import { StringsModule } from 'src/strings/strings.module';

@Module({
  controllers: [MemoController],
  providers: [MemoService, PrismaService],
  imports: [StringsModule]
})
export class MemoModule {}
