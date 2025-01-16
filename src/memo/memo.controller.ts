import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';

import { CreateMemoDto } from './dto/create-memo.dto';
import { MemoService } from './memo.service';
import { UpdateMemoDto } from './dto/update-memo.dto';

@Controller('memo')
export class MemoController {
  constructor(private readonly memoService: MemoService) {}

  @Post('create')
  async createOne(@Body() memo: CreateMemoDto) {
    return this.memoService.createOne(memo);
  }

  // @Get()
  // findAll() {
  //   return this.memoService.findAll();
  // }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.memoService.findOne(id);
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
