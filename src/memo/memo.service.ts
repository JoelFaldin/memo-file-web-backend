import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { StringsService } from 'src/strings/strings.service';
import { CreateMemoDto } from './dto/create-memo.dto';
import { UpdateMemoDto } from './dto/update-memo.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class MemoService {
  constructor(private readonly prisma: PrismaService, private stringService: StringsService) {}

  async createMemo(createMemoDto: CreateMemoDto) {
    try {
      const user = {
        rut: createMemoDto.rut,
        nombre: createMemoDto.nombre,
      }
  
      const id = randomUUID()
      const memo = {
        id,
        rut: createMemoDto.rut,
        direccion: `${this.stringService.removeLastWhiteSpaces(createMemoDto.calle)} ${createMemoDto.numero} ${createMemoDto?.aclaratoria}`,
        tipo: createMemoDto.tipo,
        patente: createMemoDto.patente,
        periodo: createMemoDto.periodo,
        capital: createMemoDto.capital,
        afecto: createMemoDto.afecto,
        total: createMemoDto.total,
        emision: createMemoDto.emision,
        giro: createMemoDto.giro,
        agtp: createMemoDto.agtp
      }
  
      const date = createMemoDto.fechaPagos.toString();
      const { day, month, year } = this.stringService.separateDate(date);
  
      await this.prisma.users.upsert({
        where: { rut: createMemoDto.rut },
        update: { nombre: createMemoDto.nombre },
        create: user,
      })
  
      await this.prisma.memos.create({
        data: memo
      })
  
      await this.prisma.pay_times.create({
        data: {
          day,
          month,
          year,
          memo_id: id
        }
      })
  
      return {
        message: 'Memorándum creado con éxito!'
      }; 
    } catch (error) {
      throw new HttpException(
        error.response ?? 'Ha ocurrido un error, inténtelo más tarde.',
        error.status ?? HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  async getOverall() {
    try {
      const memoCount = await this.prisma.memos.count();
      const payTimesCount = await this.prisma.pay_times.count();
      const userCount = await this.prisma.users.count()

      return {
        totalCount: [
          {
            label: 'Memorándums',
            count: memoCount,
          },
          {
            label: 'Fechas de pago',
            count: payTimesCount,
          },
          {
            label: 'Usuarios únicos',
            count: userCount
          },
        ]
      }
    } catch (error) {
      throw new HttpException(
        error.response ?? 'Ha ocurrido un error, inténtelo más tarde.',
        error.status ?? HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  async findMany(rol: string, rut: string, direction: string, page: number) {
    try {
      const findMemo = await this.prisma.memos.findMany({
        where: {
          patente: rol || undefined,
          rut: rut || undefined,
          direccion: {
            contains: direction || undefined,
            mode: 'insensitive'
          }  
        },
        include: {
          pay_times: true
        },
        take: 10,
        skip: 10 * (page - 1),
      })

      const memoCount = await this.prisma.memos.count({
        where: {
          patente: rol || undefined,
          rut: rut || undefined,
          direccion: {
            contains: direction || undefined,
            mode: 'insensitive'
          }  
        }
      });

      if (findMemo.length === 0 && rol === '') {
        throw new HttpException('No se ha encontrado ningún memo con los datos ingresados.', HttpStatus.BAD_REQUEST)
      }

      return findMemo.length > 1 ? {
        message: 'Memos encontrado!',
        findMemo,
        total: findMemo.length,
        nextPage: ((page * 10) - memoCount) < 0
      } : {
        message: 'Memo encontrado!',
        findMemo,
        total: findMemo.length,
        nextPage: false
      }
    } catch (error) {
      throw new HttpException(
        error.response ?? 'Ha ocurrido un error, inténtelo más tarde.',
        error.status ?? HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  update(id: number, updateMemoDto: UpdateMemoDto) {
    return `This action updates a #${id} memo`;
  }

  remove(id: number) {
    return `This action removes a #${id} memo`;
  }
}
