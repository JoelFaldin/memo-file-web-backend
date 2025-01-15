import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { CreateMemoDto } from './dto/create-memo.dto';
import { UpdateMemoDto } from './dto/update-memo.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class MemoService {
  constructor(private readonly prisma: PrismaService) {}

  async createOne(createMemoDto: CreateMemoDto) {
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

  findAll() {
    return `This action returns all memo`;
  }

  findOne(id: number) {
    return `This action returns a #${id} memo`;
  }

  update(id: number, updateMemoDto: UpdateMemoDto) {
    return `This action updates a #${id} memo`;
  }

  remove(id: number) {
    return `This action removes a #${id} memo`;
  }
}
