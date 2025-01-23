import { Controller, Get, Post, Body, Query } from '@nestjs/common';

import { CreateMemoDto } from './dto/create-memo.dto';
import { MemoService } from './memo.service';
import { UpdateMemoDto } from './dto/update-memo.dto';

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
  findOne(@Query('rol') rol: string, @Query('rut') rut: string, @Query('direction') direction: string) {
    return this.memoService.findMany(rol, rut, direction);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateMemoDto: UpdateMemoDto) {
  //   return this.memoService.update(+id, updateMemoDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.memoService.remove(+id);
  // }
}
