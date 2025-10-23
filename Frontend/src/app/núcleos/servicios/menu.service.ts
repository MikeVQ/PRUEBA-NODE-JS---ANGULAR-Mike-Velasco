// src/app/núcleos/servicios/menu.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';

export type MenuItem = {
  id: string;
  texto: string;
  ruta: string;
  icono?: string;
  orden?: number;
};

@Injectable({ providedIn: 'root' })
export class MenuService {
  private http = inject(HttpClient);
  items = signal<MenuItem[]>([]);

  async cargar(rol: 'ADMIN' | 'USUARIO' = 'USUARIO') {
    const params = new HttpParams().set('rol', rol);
    try {
      const resp = await this.http
        .get<MenuItem[]>(`${environment.apiBaseUrl}/menu`, { params })
        .toPromise();

      this.items.set((resp ?? []).sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)));
    } catch {
      
      const fallback: MenuItem[] = rol === 'ADMIN'
        ? [
            { id: 'inicio', texto: 'Bienvenida', ruta: '/inicio', orden: 1 },
            { id: 'usuarios', texto: 'Usuarios', ruta: '/usuarios', orden: 2 },
            { id: 'dashboard', texto: 'Dashboard', ruta: '/dashboard', orden: 3 },
          ]
        : [
            { id: 'inicio', texto: 'Bienvenida', ruta: '/inicio', orden: 1 },
          ];
      this.items.set(fallback);
    }
  }

  async rebuild(rol: 'ADMIN' | 'USUARIO' = 'USUARIO') {
    await this.cargar(rol);
  }
}
