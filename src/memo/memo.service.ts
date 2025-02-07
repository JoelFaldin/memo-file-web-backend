import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { StringsService } from 'src/strings/strings.service';
import { CreateMemoDto } from './dto/create-memo.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class MemoService {
  constructor(
    private readonly prisma: PrismaService,
    private stringService: StringsService,
  ) {}

  async createMemo(createMemoDto: CreateMemoDto) {
    try {
      // Creando el representante si existe:
      let id_representante: string | null = null;

      if (
        createMemoDto.rut_representante &&
        createMemoDto.nombre_representante
      ) {
        const representant = {
          representante_id: randomUUID(),
          rut_representante: createMemoDto.rut_representante,
          nombre_representante: createMemoDto.nombre_representante,
        };

        const newRepresentant = await this.prisma.representantes.create({
          data: representant,
        });

        id_representante = newRepresentant.representante_id;
      }

      // Creando el local:
      const local = {
        rut_local: createMemoDto.rut,
        nombre_local: createMemoDto.nombre,
      };

      await this.prisma.locales.upsert({
        where: {
          patente: createMemoDto.patente,
        },
        update: {},
        create: {
          local_id: randomUUID(),
          rut_local: local.rut_local,
          nombre_local: local.nombre_local,
          id_representante: id_representante,
          patente: createMemoDto.patente,
        },
      });

      const id = randomUUID();
      const date = createMemoDto.fechaPagos.toString();
      const { day, month, year } = this.stringService.separateDate(date);

      await this.prisma.pay_times.create({
        data: {
          day,
          month,
          year,
          memo_id: id,
        },
      });

      // Creando el memo:
      await this.prisma.memos.create({
        data: {
          direccion: `${this.stringService.removeLastWhiteSpaces(createMemoDto.calle)} ${createMemoDto.numero} ${createMemoDto?.aclaratoria}`,
          tipo: createMemoDto.tipo,
          periodo: createMemoDto.periodo,
          capital: createMemoDto.capital,
          afecto: createMemoDto.afecto,
          total: createMemoDto.total,
          emision: createMemoDto.emision,
          giro: createMemoDto.giro,
          agtp: createMemoDto.agtp,
          local: {
            connect: {
              patente: createMemoDto.patente,
            },
          },
          pay_times: {
            connect: {
              memo_id: id,
            },
          },
        },
      });

      return {
        message: 'Memorándum creado con éxito!',
      };
    } catch (error) {
      throw new HttpException(
        error.response ?? 'Ha ocurrido un error, inténtelo más tarde.',
        error.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getOverall() {
    try {
      const memoCount = await this.prisma.memos.count();
      const payTimesCount = await this.prisma.pay_times.count();
      const localsCount = await this.prisma.locales.count();
      const representantsCount = await this.prisma.representantes.count();

      return {
        totalCount: [
          {
            label: 'Memorándums',
            count: memoCount,
          },
          {
            label: 'Fechas de pago',
            count: payTimesCount,
          },
          {
            label: 'Locales únicos',
            count: localsCount,
          },
          {
            label: 'Representantes únicos',
            count: representantsCount,
          },
        ],
      };
    } catch (error) {
      throw new HttpException(
        error.response ?? 'Ha ocurrido un error, inténtelo más tarde.',
        error.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findMany(rol: string, rut: string, direction: string, page: number) {
    try {
      const findMemo = await this.prisma.memos.findMany({
        where: {
          direccion: {
            contains: direction || undefined,
            mode: 'insensitive',
          },
          local: {
            patente: rol || undefined,
            rut_local: rut || undefined,
          },
        },
        include: {
          pay_times: true,
          local: {
            select: {
              rut_local: true,
              nombre_local: true,
              patente: true,
              representantes: {
                select: {
                  nombre_representante: true,
                  rut_representante: true,
                },
              },
            },
          },
        },
        take: 10,
        skip: 10 * (page - 1),
      });

      const memoCount = await this.prisma.memos.count({
        where: {
          direccion: {
            contains: direction || undefined,
            mode: 'insensitive',
          },
          local: {
            rut_local: {
              contains: rut || undefined,
            },
            patente: {
              contains: rol || undefined,
            },
          },
        },
      });

      if (findMemo.length === 0 && rol === '') {
        throw new HttpException(
          'No se ha encontrado ningún memo con los datos ingresados.',
          HttpStatus.BAD_REQUEST,
        );
      }

      const totalPages = Math.ceil(memoCount / 10);

      return findMemo.length > 1
        ? {
            message: 'Memos encontrado!',
            findMemo,
            total: findMemo.length,
            nextPage: page * 10 - memoCount < 0,
            totalPages,
          }
        : {
            message: 'Memo encontrado!',
            findMemo,
            total: findMemo.length,
            nextPage: false,
            totalPages,
          };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error.response ?? 'Ha ocurrido un error, inténtelo más tarde.',
        error.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  update(id: number) {
    return `This action updates a #${id} memo`;
  }

  remove(id: number) {
    return `This action removes a #${id} memo`;
  }
}
