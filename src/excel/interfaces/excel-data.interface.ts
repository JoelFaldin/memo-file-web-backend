export interface RowInterface {
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
  'nombreRepresentante'?: string;
  'rutRepresentante'?: string;
}

interface representantes {
  representante_id: string;
  rut_representante: string;
  nombre_representante: string;
}

export interface DataInterface {
  id: string;
  direccion: string;
  tipo: string;
  periodo: string;
  capital: number;
  afecto: number;
  total: string;
  emision: number;
  giro: string;
  agtp: string;
  local_id: string;
  pay_times: {
    memo_id: string;
    day: number;
    month: number;
    year: number;
  },
  local: {
    representantes?: representantes;
    patente: string;
    nombre_local: string;
    rut_local: string;
  };
}