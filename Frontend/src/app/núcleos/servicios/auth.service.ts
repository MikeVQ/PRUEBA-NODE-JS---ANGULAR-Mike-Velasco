// src/app/núcleos/servicios/auth.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment.development';
import { MenuService } from './menu.service';

export type UsuarioAuth = {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  username: string;
  rol: 'ADMIN' | 'USUARIO';
  status: 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';
};

type LoginResp = {
  token: string;
  usuario: UsuarioAuth;
  sesionId: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private menu = inject(MenuService);
  private base = environment.apiBaseUrl;

  token = signal<string | null>(this.getStored('token'));
  rol = signal<UsuarioAuth['rol'] | null>(this.getStored('rol') as any ?? null);
  username = signal<string | null>(this.getStored('username'));
  usuario = signal<UsuarioAuth | null>(this.getStoredJson<UsuarioAuth>('usuario'));

  private getStored(key: string): string | null { try { return localStorage.getItem(key); } catch { return null; } }
  private getStoredJson<T>(key: string): T | null {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : null; } catch { return null; }
  }
  private setStored(key: string, val: string) { try { localStorage.setItem(key, val); } catch {} }
  private setStoredJson(key: string, val: any) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
  private removeStored(key: string) { try { localStorage.removeItem(key); } catch {} }

  async login(identificador: string, password: string): Promise<void> {
    const resp = await this.http.post<LoginResp>(`${this.base}/auth/login`, { identificador, password }).toPromise();
    if (!resp?.token) throw new Error('Respuesta de login inválida');

    // persistencia
    this.setStored('token', resp.token);
    this.setStored('rol', resp.usuario.rol);
    this.setStored('username', resp.usuario.username);
    this.setStoredJson('usuario', resp.usuario);

    // señales
    this.token.set(resp.token);
    this.rol.set(resp.usuario.rol);
    this.username.set(resp.usuario.username);
    this.usuario.set(resp.usuario);

    // reconstruir menú según el rol (pasa el rol explícitamente) ⬇️
    await this.menu.rebuild(resp.usuario.rol);

    // navegación por rol
    if (resp.usuario.rol === 'ADMIN') {
      await this.router.navigateByUrl('/dashboard');
    } else {
      await this.router.navigateByUrl('/inicio');
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.token()) {
        await this.http.post(`${this.base}/auth/logout`, {}).toPromise();
      }
    } catch {}

    this.removeStored('token');
    this.removeStored('rol');
    this.removeStored('username');
    this.removeStored('usuario');
    this.token.set(null);
    this.rol.set(null);
    this.username.set(null);
    this.usuario.set(null);

    // limpia menú
    this.menu.items.set([]);

    await this.router.navigateByUrl('/login');
  }

  isLoggedIn(): boolean { return !!this.token(); }
}
