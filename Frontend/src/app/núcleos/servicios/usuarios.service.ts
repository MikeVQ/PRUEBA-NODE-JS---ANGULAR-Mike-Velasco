import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { map } from 'rxjs/operators';

export type UsuarioDto = {
  id: string;
  nombres: string;
  apellidos: string;
  identificacion: string;
  username: string;
  email: string;
  rol: string;
  status: 'ACTIVO' | 'BLOQUEADO' | 'INACTIVO';
  creadoEn: string;
};

export type UsuariosResp = {
  data: UsuarioDto[];
  page: number;
  limit: number;
  total: number;
};

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  listar(page = 1, limit = 10, q = '') {
  const params: any = { page, limit };
  if (q) params.q = q;

  return this.http.get<any>(`${this.base}/usuarios`, { params }).pipe(
    map((resp: any) => {
     
      if (Array.isArray(resp)) {
        return { data: resp, page, limit, total: resp.length };
      }

      
      if (resp && Array.isArray(resp.data)) {
        return resp;
      }

   
      return { data: [], page, limit, total: 0 };
    })
  );
}


  obtener(id: string) {
    return this.http.get<UsuarioDto>(`${this.base}/usuarios/${id}`);
  }

  crear(payload: {
    nombres: string;
    apellidos: string;
    identificacion: string;
    username: string;
    password: string;
    rolNombre?: string; 
  }) {
    return this.http.post<UsuarioDto>(`${this.base}/usuarios`, payload);
  }

  actualizar(id: string, cambios: Partial<{
    nombres: string;
    apellidos: string;
    identificacion: string;
    username: string;
    password: string;
    status: 'ACTIVO' | 'BLOQUEADO' | 'INACTIVO';
    rolNombre: 'ADMIN' | 'USUARIO';
  }>) {
    return this.http.put<UsuarioDto>(`${this.base}/usuarios/${id}`, cambios);
  }

  eliminar(id: string) {
    return this.http.delete<{ ok: boolean }>(`${this.base}/usuarios/${id}`);
  }
}
