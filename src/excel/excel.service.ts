import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as XLSX from 'xlsx';

import { removeLastWhiteSpaces } from 'src/shared/helpers/removeWhitespaces.helper';
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

      await Promise.all(data.map(async (row: RowInterface) => {
        await this.prisma.users.upsert({
          where: { rut: row.rut },
          update: { nombre: row.nombre },
          create: { rut: row.rut, nombre: row.nombre },
        })

      }));

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
            direccion: `${removeLastWhiteSpaces(row.calle)} ${row.numero} ${row?.aclaratoria}`,
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

      return {
        message: 'Excel subido correctamente.'
      }
    } catch (error) {
      console.log(error)
      throw new HttpException(
        error.response ?? 'Hubo un problema en el servidor, inténtelo más tarde.',
        error.status ?? HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  async find() {
    try {
      await this.prisma.pay_times.deleteMany({});
      await this.prisma.memos.deleteMany({});
      await this.prisma.users.deleteMany({});

      const res = await this.prisma.users.findMany();
      return res;
    } catch (error) {
      console.log('Hubo un problema en el servidor, inténtelo más tarde. ', error);
    }
    
    return `This action returns all excel`;
  }
}
