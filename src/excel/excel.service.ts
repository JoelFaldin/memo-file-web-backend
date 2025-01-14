import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as XLSX from 'xlsx';

import { PrismaService } from 'src/prisma.service';

interface RowInterface {
  tipo: string;
  patente: string;
  rut: string;
  nombre: string;
  calle: string;
  numero?: string;
  aclaratoria?: string;
  periodo: string;
  capital: number;
  afecto: number;
  total: number;
  emision: number;
  fechaPago: string;
  giro: string;
  agtp?: string
}

@Injectable()
export class ExcelService {
  constructor(private prisma: PrismaService) {}

  async create(file: Express.Multer.File) {
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet);

      data.forEach(async (row: RowInterface) => {
        const usersRes = await this.prisma.user.upsert({
          where: { rut: row.rut },
          update: { nombre: row.nombre },
          create: { rut: row.rut, nombre: row.nombre },
        })

        const directionRes = await this.prisma.direction.upsert({
          where: { rut: row.rut },
          update: { aclaratoria: row.aclaratoria.toString() },
          create: {
            rut: row.rut,
            calle: row.calle.toString(),
            numero: row.numero.toString(),
            aclaratoria: row.aclaratoria.toString(),
          }
        })

        const memosRes = await this.prisma.memo.create({
          data: {
            id: randomUUID(),
            rut: row.rut,
            tipo: row.tipo,
            patente: row.patente,
            periodo: row.periodo,
            capital: row.capital,
            afecto: row.afecto,
            total: row.total,
            emision: row.emision,
            fecha_pago: new Date(row.fechaPago),
            giro: row.giro.toString(),
            agtp: row.agtp.toString(),
          }
        })
      })

      return this.prisma.memo.findMany({})
    } catch (error) {
      console.log(error)
    }
  }

  async find() {
    try {
      await this.prisma.memo.deleteMany({})
      await this.prisma.direction.deleteMany({})
      await this.prisma.user.deleteMany({})

      const res = await this.prisma.user.findMany()
      return res
    } catch (error) {
      console.log('Hubo un problema en el servidor, inténtelo más tarde. ', error)
    }
    
    return `This action returns all excel`;
  }
}
