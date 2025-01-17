import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';

import { CreateMemoDto } from './dto/create-memo.dto';
import { MemoService } from './memo.service';
import { UpdateMemoDto } from './dto/update-memo.dto';

@Controller('memo')
export class MemoController {
  constructor(private readonly memoService: MemoService) {}

  @Post('create')
  async createMany(@Body() memo: CreateMemoDto) {
    return this.memoService.createMany(memo);
  }

  @Get('overall')
  findAll() {
    return this.memoService.getOverall();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.memoService.findMany(id);
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
