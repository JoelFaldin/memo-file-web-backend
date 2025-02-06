import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PassThrough } from 'node:stream';
import { randomUUID } from 'node:crypto';
import { Response } from 'express';
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
  agtp?: string;
  'Nombre representante'?: string;
  'Rut representante'?: string;
}

@Injectable()
export class ExcelService {
  constructor(
    private prisma: PrismaService,
    private stringService: StringsService,
  ) {}

  async create(file: Express.Multer.File) {
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet, { defval: null });

      // Procesando y guardando los representantes:
      const allRepresentants = data.map((row: RowInterface) => {
        return {
          rut: row['Rut representante'],
          nombre: row['Nombre representante'],
        };
      });

      const existingRepresentants = await this.prisma.representantes.findMany({
        where: {
          rut_representante: {
            in: allRepresentants.map((rep) => rep.rut ?? ''),
          },
        },
      });

      const uniqueExistingRepresentants = new Set(
        existingRepresentants.map(
          (representant) => representant.rut_representante,
        ),
      );
      const createRepresentants = [];

      data.forEach((row: RowInterface) => {
        if (
          uniqueExistingRepresentants.has(row['Rut representante']) ||
          !row['Rut representante'] ||
          !row['Nombre representante']
        ) {
          return;
        } else if (row['Rut representante'] || row['Nombre representante']) {
          createRepresentants.push({
            representante_id: randomUUID(),
            rut_representante: row['Rut representante'],
            nombre_representante: row['Nombre representante'],
          });
        }
      });

      const batchesSize = 10000;
      for (let i = 0; i < createRepresentants.length; i += batchesSize) {
        const batch = createRepresentants.slice(i, i + batchesSize);
        await this.prisma.representantes.createMany({
          data: batch,
          skipDuplicates: true,
        });
      }

      // Mapeando la id de cada representante creado junto a su rut:
      const createdRepresentants = await this.prisma.representantes.findMany({
        where: {
          rut_representante: {
            in: data
              .map((row: RowInterface) => row['Rut representante'])
              .filter((rut): rut is string => Boolean(rut)),
          },
        },
        select: {
          representante_id: true,
          rut_representante: true,
        },
      });

      const mappedRepresentants = createdRepresentants.reduce(
        (map, current) => {
          map[current.rut_representante] = current.representante_id;
          return map;
        },
        {},
      );

      // Procesando y guardando los locales:
      const allLocalPatentes = Array.from(
        new Set(data.map((row: RowInterface) => row.patente)),
      );
      const results = [];

      for (let i = 0; i < allLocalPatentes.length; i += batchesSize) {
        const chunk = allLocalPatentes.slice(i, i + batchesSize);

        const existingLocals = await this.prisma.locales.findMany({
          where: {
            patente: {
              in: Array.from(chunk.map((c) => c?.toString())),
            },
          },
          select: {
            patente: true,
          },
        });

        results.push(...existingLocals);
      }

      const uniqueExistingLocalPatentes = new Set(
        results.map((local) => local.patente),
      );
      const createLocals = [];

      data.forEach((row: RowInterface) => {
        let sanitizedRut =
          this.stringService.removeAnyWhiteSpaces(row.rut?.toString()) ?? '';

        if (!sanitizedRut || sanitizedRut === '0') {
          sanitizedRut = '-';
        }

        if (uniqueExistingLocalPatentes.has(row.patente)) {
          return;
        } else {
          createLocals.push({
            local_id: randomUUID(),
            rut_local: sanitizedRut,
            nombre_local: this.stringService.removeLastWhiteSpaces(row.nombre),
            patente: row.patente,
            id_representante:
              mappedRepresentants[row['Rut representante']] ?? null,
          });
        }
      });

      const specials = createLocals.filter((local) => local.rut_local === '-');

      await this.prisma.locales.createMany({
        data: specials,
        skipDuplicates: true,
      });

      for (let i = 0; i < createLocals.length; i += batchesSize) {
        const batch = createLocals.slice(i, i + batchesSize);
        const uniqueByPatente = [];
        const seenPatentes = new Set();

        for (const item of batch) {
          if (!seenPatentes.has(item.patente)) {
            uniqueByPatente.push(item);
            seenPatentes.add(item.patente);
          }
        }

        await this.prisma.locales.createMany({
          data: uniqueByPatente,
          skipDuplicates: true,
        });
      }

      // Mapeando la id de cada local con cada memo:
      const createdLocals = await this.prisma.locales.findMany({
        where: {
          patente: {
            in: data.map((row: RowInterface) => row.patente),
          },
        },
        select: {
          local_id: true,
          patente: true,
        },
      });

      const mappedLocals = createdLocals.reduce((map, current) => {
        map[current.patente] = current.local_id;
        return map;
      }, {});

      // Procesando y guardando los memos:
      const allMemos = data.map((row: RowInterface) => {
        const id = randomUUID();
        const direction = `${this.stringService.removeLastWhiteSpaces(row.calle.toString())} ${row?.numero ? this.stringService.removeLastWhiteSpaces(row.numero.toString()) : ''} ${row?.aclaratoria ? this.stringService.removeLastWhiteSpaces(row.aclaratoria.toString()) : ''}`;
        const { year, month, day } = this.stringService.separateDateNoDash(
          row.fechaPago,
        );

        return {
          payTime: {
            memo_id: id,
            year: parseInt(year.join('')),
            month: parseInt(month.join('')),
            day: parseInt(day.join('')),
          },
          memos: {
            id,
            direccion: direction,
            tipo: row.tipo,
            periodo: row.periodo,
            capital: row.capital,
            afecto: row.afecto,
            total: row.total,
            emision: row.emision,
            giro: `${this.stringService.removeLastWhiteSpaces(row.giro?.toString())}`,
            agtp: row.agtp?.toString(),
            local_id: mappedLocals[row.patente],
          },
        };
      });

      for (let i = 0; i < allMemos.length; i += batchesSize) {
        const memoSlice = allMemos.slice(i, i + batchesSize);

        await this.prisma.pay_times.createMany({
          data: memoSlice.map((memo) => memo.payTime),
          skipDuplicates: true,
        });

        await this.prisma.memos.createMany({
          data: memoSlice.map((memo) => memo.memos),
          skipDuplicates: true,
        });
      }

      return {
        message: 'Excel subido correctamente.',
      };
    } catch (error) {
      console.log(error.message);
      throw new HttpException(
        error.response ??
          'Hubo un problema en el servidor, inténtelo más tarde.',
        error.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async downloadData(res: Response) {
    const batchSize = 10000;
    let hasMoreData = true;
    let skip = 0;
    const data = [];

    const passStream = new PassThrough();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename="data.xlsx"');

    // const workbook = XLSX.utils.book_new();

    while (hasMoreData) {
      const batch = await this.prisma.memos.findMany({
        skip,
        take: batchSize,
        include: {
          pay_times: true,
        },
      });

      console.log(batch[0]);

      if (batch.length < batchSize) {
        console.log(skip, batchSize);
        hasMoreData = false;
      }

      // const flattenedData = batch.map((memo: DatabaseInterface) => {
      //   const fechaDePago = memo.pay_times ? {
      //     day: memo.pay_times.day,
      //     month: memo.pay_times.month,
      //     year: memo.pay_times.year,
      //   } : { day: 0, month: 0, year: 0 };

      //   return {
      //     rut: memo.rut || '',
      //     tipo: memo.tipo || '',
      //     patente: memo.patente || '',
      //     nombre: memo.representantes.length > 0 && memo.representantes[0].locales.length > 0 ? memo.representantes[0].locales[0].nombre_local : '',
      //     direccion: memo.direccion || '',
      //     periodo: memo.periodo || '',
      //     capital: memo.capital ? parseFloat(memo.capital.toString()) : 0,
      //     afecto: memo.afecto || 0,
      //     total: memo.total ? parseFloat(memo.total.toString()) : 0,
      //     emisiones: memo.emision || 0,
      //     "fecha de pago": fechaDePago,
      //     giro: memo.giro || '',
      //     agtp: memo.agtp || '',
      //     "rut representante": memo.representantes[0].rut_representante || '',
      //     "nombre representante": memo.representantes[0].nombre_representante || '',
      //   };
      // })

      // const worksheet = XLSX.utils.json_to_sheet(flattenedData);
      // XLSX.utils.book_append_sheet(workbook, worksheet, `Batch ${skip / batchSize + 1}`);

      // const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      // passStream.write(buffer);

      data.push(...batch);
      skip += batchSize;
    }

    passStream.end();
    passStream.pipe(res);
  }
}
