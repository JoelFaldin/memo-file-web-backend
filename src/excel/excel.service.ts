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
        await this.prisma.users.upsert({
          where: { rut: row.rut },
          update: { nombre: row.nombre },
          create: { rut: row.rut, nombre: row.nombre },
        })

        await this.prisma.directions.upsert({
          where: { rut: row.rut },
          update: { aclaratoria: row.aclaratoria ? row.aclaratoria.toString() : null },
          create: {
            rut: row.rut,
            calle: row.calle.toString(),
            numero: row.numero ? row.numero.toString() : null,
            aclaratoria: row.aclaratoria ? row.aclaratoria.toString() : null,
          }
        })
      });

      const allMemos = data.map((row: RowInterface) => {
        const date = row.fechaPago.toString();
        const dateArray = date.split("");
        const year = [...dateArray.slice(0, 4)];
        const month = [...dateArray.slice(4, 6)];
        const day = [...dateArray.slice(6, 8)];
        const id = randomUUID();

        return {
          payTime: {
            memo_id: id,
            year: parseInt(year.join("")),
            month: parseInt(month.join("")),
            day: parseInt(day.join(""))
          },
          memos: {
            id: id,
            rut: row.rut,
            tipo: row.tipo,
            patente: row.patente,
            periodo: row.periodo,
            capital: row.capital,
            afecto: row.afecto,
            total: row.total,
            emision: row.emision,
            giro: row.giro.toString(),
            agtp: row.agtp.toString()
          }
        };
      });
      
      await this.prisma.memos.createMany({
        data: allMemos.map(memo => memo.memos)
      });

      await this.prisma.pay_times.createMany({
        data: allMemos.map(memo => memo.payTime)
      });

      return this.prisma.memos.findMany({});
    } catch (error) {
      console.log(error);
    }
  }

  async find() {
    try {
      await this.prisma.pay_times.deleteMany({});
      await this.prisma.memos.deleteMany({});
      await this.prisma.directions.deleteMany({});
      await this.prisma.users.deleteMany({});

      const res = await this.prisma.users.findMany();
      return res;
    } catch (error) {
      console.log('Hubo un problema en el servidor, inténtelo más tarde. ', error);
    }
    
    return `This action returns all excel`;
  }
}
