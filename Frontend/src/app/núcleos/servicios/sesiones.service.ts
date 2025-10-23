import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';

export type SesionDto = {
  id: string;
  inicio: string;
  fin: string | null;
  exito: boolean;
  mensaje: string | null;
  ip: string | null;
  userAgent: string | null;
  activo: boolean;
  creadoEn: string;
};

export type SesionesResp = {
  data: SesionDto[];
  page: number;
  limit: number;
  total: number;
};

@Injectable({ providedIn: 'root' })
export class SesionesService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  listar(usuarioId: string, page = 1, limit = 20, opts?: { exito?: boolean|null; activo?: boolean|null }) {
    let params = new HttpParams().set('usuarioId', usuarioId).set('page', page).set('limit', limit);
    if (opts?.exito !== undefined && opts.exito !== null) params = params.set('exito', String(opts.exito));
    if (opts?.activo !== undefined && opts.activo !== null) params = params.set('activo', String(opts.activo));
    return this.http.get<SesionesResp>(`${this.base}/sesiones`, { params });
  }
}