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

  async findMany(patente: string) {
    try {
      const findMemo = await this.prisma.memos.findMany({
        where: {
          patente: patente
        },
        include: {
          pay_times: true
        }
      })

      const joinedMemos = findMemo.map((memo) => {
        const day = memo.pay_times.day
        const month = memo.pay_times.month
        const year = memo.pay_times.year

        return {
          ...memo,
          pay_times: `${day}-${month}-${year}`
        }
      })

      if (joinedMemos.length === 0) {
        throw new HttpException('No se ha encontrado ningún memo con esta patente.', HttpStatus.BAD_REQUEST)
      }

      return joinedMemos.length > 1 ? {
        message: 'Memos encontrado!',
        joinedMemos,
        total: joinedMemos.length
      } : {
        message: 'Memo encontrado!',
        joinedMemos,
        total: joinedMemos.length
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
