import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as XLSX from 'xlsx';

import { StringsService } from 'src/strings/strings.service';
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
  rutRepresentante?: string,
  nombreRepresentante?: string
}

@Injectable()
export class ExcelService {
  constructor(private prisma: PrismaService, private stringService: StringsService) {}

  async create(file: Express.Multer.File) {
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet);

      await Promise.all(data.map(async (row: RowInterface) => {
        await this.prisma.locales.upsert({
          where: { rut_local: row.rut },
          update: { nombre_local: row.nombre },
          create: { rut_local: row.rut, nombre_local: row.nombre },
        })
      }));

      const allMemos = await Promise.all(data.map(async (row: RowInterface) => {
        const { year, month, day } = this.stringService.separateDateNoDash(row.fechaPago);
        const id = randomUUID();

        const currentMemo = await this.prisma.memos.findFirst({
          where: { patente: row.patente },
          select: { representantes: true }
        })

        const newRepresentant = {
          rut_representante: row.rutRepresentante ?? currentMemo?.representantes.rut_representante,
          nombre_representante: row.nombreRepresentante ?? currentMemo?.representantes.nombre_representante,
        }

        await this.prisma.representantes.upsert({
          where: { patente: row.patente },
          update: {
            rut_representante: newRepresentant.rut_representante,
            nombre_representante: newRepresentant.nombre_representante,
          },
          create: {
            patente: row.patente,
            rut_representante: newRepresentant.rut_representante,
            nombre_representante: newRepresentant.nombre_representante,
          },
        })

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
            direccion: `${this.stringService.removeLastWhiteSpaces(row.calle.toString())} ${row?.numero ? row.numero : ''} ${row?.aclaratoria ? row.aclaratoria : ''}`,
            tipo: row.tipo,
            patente: row.patente,
            periodo: row.periodo,
            capital: row.capital,
            afecto: row.afecto,
            total: row.total,
            emision: row.emision,
            giro: `${this.stringService.removeLastWhiteSpaces(row.giro.toString())}`,
            agtp: row.agtp.toString()
          }
        };
      }));

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
}
