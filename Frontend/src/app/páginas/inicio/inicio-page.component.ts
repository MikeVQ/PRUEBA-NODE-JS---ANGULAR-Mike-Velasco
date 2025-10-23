import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../núcleos/servicios/auth.service';
import { environment } from '../../../environments/environment.development';

type BienvenidaResp = {
  usuario: {
    nombres: string;
    apellidos: string;
    email: string;
    username: string;
    status: string;
    intentosFallidos: number; // contador de reintentos que se resetea al éxito
  };
  ultimaSesion: {
    inicio: string;
    fin: string | null;
    exito: boolean;
    mensaje: string;
  } | null;

  // NUEVOS CAMPOS que añadimos en el backend
  recientes24hDesde?: string;                 // ISO de la ventana de 24h
  intentosFallidosRecientes24h?: number;      // fallos en últimas 24h
  intentosFallidosDesdeUltimoExito?: number;  // fallos desde el último login exitoso
};

@Component({
  selector: 'app-inicio-page',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
  <section class="inicio contenedor" *ngIf="data() as d">
    <h1>Bienvenido, {{ d.usuario.nombres }} {{ d.usuario.apellidos }}</h1>
    <p>Usuario: <strong>{{ d.usuario.username }}</strong> — Estado: <strong>{{ d.usuario.status }}</strong></p>

    <!-- Usa "d" (no "data") porque arriba hiciste "data() as d" -->
    <p *ngIf="d.intentosFallidosRecientes24h !== undefined">
      Intentos fallidos recientes (24 h): {{ d.intentosFallidosRecientes24h }}
    </p>
    <p *ngIf="d.intentosFallidosDesdeUltimoExito !== undefined">
      Intentos fallidos desde tu último inicio exitoso: {{ d.intentosFallidosDesdeUltimoExito }}
    </p>

    <div *ngIf="d.ultimaSesion as s; else sinSesion" class="tarjeta">
      <h3>Última sesión</h3>
      <p>Inicio: {{ s.inicio | date:'short' }}</p>
      <p *ngIf="s.fin">Fin: {{ s.fin | date:'short' }}</p>
      <p>Resultado: {{ s.exito ? 'Éxito' : 'Fallida' }} — {{ s.mensaje }}</p>
    </div>
    <ng-template #sinSesion><p>No hay registro de sesión previa.</p></ng-template>

    <button (click)="cerrar()">Cerrar sesión</button>

    <p class="error" *ngIf="error()">{{ error() }}</p>
  </section>
  `,
  styles: [`
    .contenedor { max-width: 720px; margin: 2rem auto; }
    .tarjeta { border: 1px solid #ddd; padding: 1rem; border-radius: .5rem; margin-top: 1rem; }
    .error { color: #c62828; margin-top: 1rem; }
  `]
})
export class InicioPageComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  data = signal<BienvenidaResp | null>(null);
  error = signal('');

  get apiBase() { return environment.apiBaseUrl; }

  async ngOnInit() {
    try {
      const resp = await this.http.get<BienvenidaResp>(`${this.apiBase}/auth/bienvenida`).toPromise();
      this.data.set(resp ?? null);
    } catch (e: any) {
      this.error.set(e?.error?.error || 'No se pudo cargar la bienvenida');
    }
  }

  async cerrar() {
    await this.auth.logout();
  }
}
