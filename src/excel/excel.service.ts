import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ExcelService {
  constructor(private prisma: PrismaService) {}

  create(file: Express.Multer.File) {
    console.log(file)
    return 'it got the file'
  }

  async find() {
    try {
      const res = await this.prisma.user.findMany()
      return res
    } catch (error) {
      console.log('Hubo un problema en el servidor, inténtelo más tarde. ', error)
    }
    
    return `This action returns all excel`;
  }
}
