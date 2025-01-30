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

      // Procesando y guardando los representantes:
      const allRepresentants = data.map((row: RowInterface) => {
        return {
          patente: row.patente,
          rut: row.rutRepresentante,
          nombre: row.nombreRepresentante
        }
      });

      const existingRepresentants = await this.prisma.representantes.findMany({
        where: {
          rut_representante: {
            in: allRepresentants.map(rep => rep.rut ?? "")
          }
        },
      });

      const uniqueExistingRepresentants = new Set(existingRepresentants.map(representant => representant.rut_representante));
      const createRepresentants = [];

      data.forEach((row: RowInterface) => {
        if (uniqueExistingRepresentants.has(row.rutRepresentante)) {
          return;
        } else if (row.rutRepresentante && row.nombreRepresentante) {
          createRepresentants.push({
            representante_id: randomUUID(),
            patente: row.patente,
            rut_representante: row.rutRepresentante,
            nombre_representante: row.nombreRepresentante
          })
        }
      })

      // await Promise.all([
      //   updateRepresentants.length > 0 && updateRepresentants.map(async row => {
      //     console.log('updating...');
      //     await this.prisma.representantes.update(row);
      //   })
      // ])
      
      const batchesSize = 10000;
      for (let i = 0; i < createRepresentants.length; i += batchesSize) {
        const batch = createRepresentants.slice(i, i + batchesSize);
        await this.prisma.representantes.createMany({
          data: batch,
          skipDuplicates: true
        });
      };

      // Mapeando la id de cada representante creado junto a su rut:
      const createdRepresentants = await this.prisma.representantes.findMany({
        where: {
          rut_representante: {
            in: data.map((row: RowInterface) => row.rutRepresentante).filter((rut): rut is string => !!rut),
          }
        },
        select: {
          representante_id: true,
          rut_representante: true
        }
      });

      const mappedRepresentants = createdRepresentants.reduce((map, current) => {
        map[current.rut_representante] = current.representante_id;
        return map;
      }, {})

      // Procesando y guardando los locales:
      const allLocalRuts = data.map((row: RowInterface) => row.rut).filter(rut => Boolean(rut));
      const results = [];
      for (let i = 0; i < allLocalRuts.length; i += batchesSize) {
        const chunk = allLocalRuts.slice(i, i + batchesSize);

        const existingLocals = await this.prisma.locales.findMany({
          where: {
            rut_local: {
              in: Array.from(chunk.map(c => c.toString()))
            },
          },
          select: {
            rut_local: true
          },
        });

        results.push(...existingLocals)
      }

      const uniqueExistingLocalRuts = new Set(results.map(local => local.rut_local));
      const createLocals = [];

      data.forEach((row: RowInterface) => {
        if (uniqueExistingLocalRuts.has(row.rut)) {
          return
        } else {
          createLocals.push({
            rut_local: row.rut ?? "",
            nombre_local: this.stringService.removeLastWhiteSpaces(row.nombre),
            id_representante: mappedRepresentants[row.rutRepresentante] ?? null
          });
        }
      });

      const specials = createLocals.filter(local => local.rut_local === '-');
      await this.prisma.locales.createMany({
        data: specials,
        skipDuplicates: true
      });

      // updateLocals.length > 0 && updateLocals.map(async row => {
      //   console.log('updating...');
      //   await this.prisma.locales.update(row);
      // })

      for (let i = 0; i < createLocals.length; i += batchesSize) {
        const batch = createLocals.slice(i, i + batchesSize);
        await this.prisma.locales.createMany({
          data: batch,
          skipDuplicates: true
        })
      }

      const allMemos = await Promise.all(data.map(async (row: RowInterface) => {
        const { year, month, day } = this.stringService.separateDateNoDash(row.fechaPago);
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

      // const seen = new Set();
      // const uniqueData = [];
      // const duplicates = [];

      // allMemos.forEach(memo => {
      //   const { patente, periodo, rut, direccion } = memo.memos;
      //   const key = `${rut}-${patente}-${periodo}-${direccion}`;

      //   if (seen.has(key)) {
      //     duplicates.push(memo.memos);
      //     console.log(`Duplicate found: rut: ${rut}, patente: ${patente}, periodo: ${periodo}, direccion: ${direccion}`);
      //   } else {
      //     seen.add(key);
      //     uniqueData.push(memo.memos);
      //   }
      // })

      // if (duplicates.length > 0) {
      //   console.log('Duplicate Entries:', duplicates);
      // }

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
      console.log(error.message)
      throw new HttpException(
        error.response ?? 'Hubo un problema en el servidor, inténtelo más tarde.',
        error.status ?? HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }
}
