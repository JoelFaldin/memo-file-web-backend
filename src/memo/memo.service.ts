import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { CreateMemoDto } from './dto/create-memo.dto';
import { UpdateMemoDto } from './dto/update-memo.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class MemoService {
  constructor(private readonly prisma: PrismaService) {}

  async createMany(createMemoDto: CreateMemoDto) {
    const user = {
      rut: createMemoDto.rut,
      nombre: createMemoDto.nombre,
    }

    const direction = {
      rut: createMemoDto.rut,
      calle: createMemoDto.calle,
      numero: createMemoDto.numero,
      aclaratoria: createMemoDto?.aclaratoria
    }

    const id = randomUUID()
    const memo = {
      id,
      rut: createMemoDto.rut,
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
    const dateArray = date.split("");
    const year = [...dateArray.slice(0, 4)];
    const month = [...dateArray.slice(4, 6)];
    const day = [...dateArray.slice(6, 8)];

    const fechaPago = {
      day: parseInt(day.join()),
      month: parseInt(month.join()),
      year: parseInt(year.join()),
      memo_id: id
    }

    await this.prisma.users.upsert({
      where: { rut: createMemoDto.rut },
      update: { nombre: createMemoDto.nombre },
      create: user,
    })

    await this.prisma.directions.upsert({
      where: { rut: createMemoDto.rut },
      update: { aclaratoria: createMemoDto.aclaratoria ? createMemoDto.aclaratoria.toString() : null },
      create: direction
    })

    await this.prisma.memos.create({
      data: memo
    })

    await this.prisma.pay_times.create({
      data: fechaPago
    })


    return 1;
  }

  async getOverall() {
    try {
      const memoCount = await this.prisma.memos.count();
      const directionCount = await this.prisma.directions.count();
      const payTimesCount = await this.prisma.pay_times.count();
      const userCount = await this.prisma.users.count()

      return {
        response: 'ok',
        totalCount: [
          {
            label: 'Memorándums',
            count: memoCount,
          },
          {
            label: 'Direcciones',
            count: directionCount,
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
      console.log(error)
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

      return joinedMemos.length === 0 ? {
        message: 'No se ha encontrado ningún memo con esta patente.',
        joinedMemos
      } : joinedMemos.length > 1 ? {
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
