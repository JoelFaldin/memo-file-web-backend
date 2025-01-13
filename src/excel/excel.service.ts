import { Injectable } from '@nestjs/common';

import { CreateExcelDto } from './dto/create-excel.dto';
import { PrismaService } from 'src/prisma.service';
import { CLIENT_RENEG_LIMIT } from 'tls';

@Injectable()
export class ExcelService {
  constructor(private prisma: PrismaService) {}

  create(createExcelDto: CreateExcelDto) {
    return 'This action adds a new excel';
  }

  async find() {
    try {
      const res = await this.prisma.user.findMany()
      console.log(res)
      return res
    } catch (error) {
      console.log('Hubo un problema en el servidor, inténtelo más tarde. ', error)
    }
    
    return `This action returns all excel`;
  }
}
