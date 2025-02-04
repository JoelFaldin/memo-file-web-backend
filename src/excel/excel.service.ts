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
  rutRepresentante?: string;
  nombreRepresentante?: string;
}

// interface DatabaseInterface {
//   rut: string;
//   tipo: string;
//   patente: string;
//   direccion: string;
//   periodo: string;
//   capital: Decimal;
//   afecto: number;
//   total: Decimal;
//   emision: number;
//   pay_times: {
//     day: number;
//     month: number;
//     year: number;
//   };
//   giro: string;
//   agtp: string;
//   representantes: Array<{
//     rut_representante: string;
//     nombre_representante: string;
//     locales: Array<{
//       rut_local: string;
//       nombre_local: string;
//       id_representante: string;
//     }>;
//   }>;
// }

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
      const data = XLSX.utils.sheet_to_json(worksheet);

      // Procesando y guardando los representantes:
      const allRepresentants = data.map((row: RowInterface) => {
        return {
          rut: row.rutRepresentante,
          nombre: row.nombreRepresentante,
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
          uniqueExistingRepresentants.has(row.rutRepresentante) ||
          !row.rutRepresentante ||
          !row.nombreRepresentante
        ) {
          return;
        } else if (row.rutRepresentante && row.nombreRepresentante) {
          createRepresentants.push({
            representante_id: randomUUID(),
            patente: row.patente,
            rut_representante: row.rutRepresentante,
            nombre_representante: row.nombreRepresentante,
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
              .map((row: RowInterface) => row.rutRepresentante)
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
      const allLocalRuts = data
        .map((row: RowInterface) => row.rut)
        .filter((rut) => Boolean(rut));
      const results = [];

      for (let i = 0; i < allLocalRuts.length; i += batchesSize) {
        const chunk = allLocalRuts.slice(i, i + batchesSize);

        const existingLocals = await this.prisma.locales.findMany({
          where: {
            rut_local: {
              in: Array.from(chunk.map((c) => c.toString())),
            },
          },
          select: {
            rut_local: true,
          },
        });

        results.push(...existingLocals);
      }

      const uniqueExistingLocalRuts = new Set(
        results.map((local) => local.rut_local),
      );
      const createLocals = [];

      data.forEach((row: RowInterface) => {
        if (uniqueExistingLocalRuts.has(row.rut)) {
          return;
        } else {
          createLocals.push({
            rut_local:
              this.stringService.removeAnyWhiteSpaces(row.rut.toString()) ??
              '-',
            nombre_local: this.stringService.removeLastWhiteSpaces(row.nombre),
            patente: row.patente,
            id_representante: mappedRepresentants[row.rutRepresentante] ?? null,
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

        await this.prisma.locales.createMany({
          data: batch,
          skipDuplicates: true,
        });
      }

      // Procesando y guardando los memos:
      // const allMemos = data.map((row: RowInterface) => {
      //   const id = randomUUID();
      //   const { year, month, day } = this.stringService.separateDateNoDash(
      //     row.fechaPago,
      //   );

      //   return {
      //     payTime: {
      //       memo_id: id,
      //       year: parseInt(year.join('')),
      //       month: parseInt(month.join('')),
      //       day: parseInt(day.join('')),
      //     },
      //     memos: {
      //       id,
      //       direccion: `${this.stringService.removeLastWhiteSpaces(row.calle.toString())} ${row?.numero ? row.numero : ''} ${row?.aclaratoria ? row.aclaratoria : ''}`,
      //       tipo: row.tipo,
      //       periodo: row.periodo,
      //       capital: row.capital,
      //       afecto: row.afecto,
      //       total: row.total,
      //       emision: row.emision,
      //       giro: `${this.stringService.removeLastWhiteSpaces(row.giro.toString())}`,
      //       agtp: row.agtp.toString(),
      //       rut_local: row.rut,
      //       nombre_local: this.stringService.removeLastWhiteSpaces(row.nombre),
      //     },
      //   };
      // });

      // for (let i = 0; i < allMemos.length; i += batchesSize) {
      //   const memoSlice = allMemos.slice(i, i + batchesSize);

      //   await this.prisma.pay_times.createMany({
      //     data: memoSlice.map((memo) => memo.payTime),
      //     skipDuplicates: true,
      //   });

      //   await this.prisma.memos.createMany({
      //     data: memoSlice.map((memo) => memo.memos),
      //     skipDuplicates: true,
      //   });
      // }

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
