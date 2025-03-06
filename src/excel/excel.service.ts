import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Response } from 'express';

import { read, write, utils } from 'xlsx';

import { RowInterface } from './interfaces/excel-data.interface';
import { StringsService } from 'src/strings/strings.service';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ExcelService {
  constructor(
    private prisma: PrismaService,
    private stringService: StringsService,
  ) {}

  async create(file: Express.Multer.File) {
    try {
      const workbook = read(file.buffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = utils.sheet_to_json(worksheet, { defval: null });

      // Procesando y guardando los representantes:
      const allRepresentants = data.map((row: RowInterface) => {
        return {
          rut: row['rutRepresentante'],
          nombre: row['nombreRepresentante'],
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
          uniqueExistingRepresentants.has(row['rutRepresentante']) ||
          !row['rutRepresentante'] ||
          !row['nombreRepresentante']
        ) {
          return;
        } else if (row['rutRepresentante'] || row['nombreRepresentante']) {
          createRepresentants.push({
            representante_id: randomUUID(),
            rut_representante: row['rutRepresentante'],
            nombre_representante: row['nombreRepresentante'],
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
              .map((row: RowInterface) => row['rutRepresentante'])
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
              mappedRepresentants[row['rutRepresentante']] ?? null,
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
    let data = [];

    const workbook = utils.book_new();

    while (hasMoreData) {
      const batch = await this.prisma.memos.findMany({
        skip,
        take: batchSize,
        include: {
          pay_times: true,
          local: {
            select: {
              representantes: true,
              patente: true,
              nombre_local: true,
              rut_local: true
            }
          }
        },
      });

      if (batch.length === 0) break;

      const formattedData = batch.map((row) => ({
        "tipo": row.tipo,
        "patente": row.local.patente,
        "rut": row.local.rut_local,
        "nombre": row.local.nombre_local,
        "dirección": row.direccion,
        "periodo": row.periodo,
        "capital": Number(row.capital),
        "afecto": row.afecto,
        "total": Number(row.total),
        "emisión": row.emision,
        "fecha de pago": `${row.pay_times.year}${row.pay_times.month}${row.pay_times.day}`,
        "giro": row.giro,
        "agtp": row.agtp,
        "rut representante": row.local?.representantes?.rut_representante || '',
        "nombre representante": row.local?.representantes?.nombre_representante || '',
      }));

      data.push(...formattedData);

      let worksheet;
      if (skip === 0) {
        worksheet = utils.json_to_sheet(data);
        utils.book_append_sheet(workbook, worksheet, 'Memorándums');
      } else {
        worksheet = workbook.Sheets['Memorándums'];
        utils.sheet_add_json(worksheet, data, { skipHeader: true, origin: -1 })
      }

      data = [];
      skip += batchSize;
    }

    const excelBuffer = write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename="data.xlsx"');
    res.send(excelBuffer);
  }
}
