import { Controller, Get, Post, Body, Query } from '@nestjs/common';

import { CreateMemoDto } from './dto/create-memo.dto';
import { MemoService } from './memo.service';

@Controller('memo')
export class MemoController {
  constructor(private readonly memoService: MemoService) {}

  @Post('create')
  async createMany(@Body() memo: CreateMemoDto) {
    return this.memoService.createMemo(memo);
  }

  @Get('overall')
  findAll() {
    return this.memoService.getOverall();
  }

  @Get('find')
  findOne(
    @Query('rol') rol: string,
    @Query('rut') rut: string,
    @Query('direction') direction: string,
    @Query('page') page: number,
  ) {
    return this.memoService.findMany(rol, rut, direction, page);
  }

  @Get('infinite')
  fetchInfinite(
    @Query('rol') rol: string,
    @Query('rut') rut: string,
    @Query('direction') direction: string,
    @Query('pageparam') pageParam: string,
    @Query('limit') limit: number,
  ) {
    return this.memoService.fetchInfinite(
      rol,
      rut,
      direction,
      pageParam,
      limit,
    );
  }
}
