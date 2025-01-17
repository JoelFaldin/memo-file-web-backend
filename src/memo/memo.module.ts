import { Module } from '@nestjs/common';
import { MemoService } from './memo.service';
import { MemoController } from './memo.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [MemoController],
  providers: [MemoService, PrismaService],
})
export class MemoModule {}
