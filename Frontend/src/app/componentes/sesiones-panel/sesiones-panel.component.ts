import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';

type Sesion = {
  _id: string;
  inicio: string;
  fin: string | null;
  exito: boolean;
  mensaje?: string;
  ip?: string;
  userAgent?: string;
  activo?: boolean;
};

type SesionesResp = {
  usuarioId: string;
  username?: string;
  total: number;
  activas: number;
  items: Sesion[];
};

@Component({
  selector: 'app-sesiones-panel',
  standalone: true,
  imports: [CommonModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="tarjeta" *ngIf="usuarioId; else noUsuario">
    <header class="toolbar">
      <h3 class="h1">Sesiones de {{ aliasUsuario || ('usuario ' + (usuarioId | slice: -6)) }}</h3>
      <div class="filtros">
        <button class="btn" type="button" (click)="recargar()" [disabled]="cargando()">Actualizar</button>
        <button class="btn-outline" type="button" (click)="cerrar.emit()">Cerrar</button>
      </div>
    </header>

    <div *ngIf="error()" class="tarjeta error">{{ error() }}</div>

    <div class="tabla-wrapper" *ngIf="!(error()); else errTpl">
      <table class="tabla">
        <thead>
          <tr>
            <th style="width: 56px;">#</th>
            <th>Inicio</th>
            <th>Fin</th>
            <th>Resultado</th>
            <th>Mensaje</th>
            <th>IP</th>
            <th>Agente</th>
            <th>Activa</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let s of (data()?.items || []); let i=index; trackBy: trackById">
            <td>{{ i + 1 }}</td>
            <td>{{ s.inicio | date:'short' }}</td>
            <td>{{ s.fin ? (s.fin | date:'short') : '—' }}</td>
            <td>
              <span class="badge" [class.badge-ok]="s.exito" [class.badge-danger]="!s.exito">
                {{ s.exito ? 'Éxito' : 'Fallida' }}
              </span>
            </td>
            <td>{{ s.mensaje || '—' }}</td>
            <td>{{ s.ip || '—' }}</td>
            <td><span title="{{ s.userAgent }}">{{ acortarUA(s.userAgent) }}</span></td>
            <td>
              <span class="badge" [class.badge-ok]="s.activo" [class.badge-warn]="!s.activo">
                {{ s.activo ? 'Sí' : 'No' }}
              </span>
            </td>
          </tr>
          <tr *ngIf="!(data()?.items?.length)">
            <td colspan="8" style="text-align:center; padding:.8rem;">Sin registros</td>
          </tr>
        </tbody>
      </table>
    </div>

    <ng-template #errTpl>
      <div class="tarjeta error">{{ error() }}</div>
    </ng-template>
  </div>

  <ng-template #noUsuario>
    <div class="tarjeta">Selecciona un usuario para ver sus sesiones.</div>
  </ng-template>
  `
})
export class SesionesPanelComponent implements OnChanges {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private apiBase = environment.apiBaseUrl;

  /** ⚠️ Cuando cambie este Input, recargamos automáticamente */
  @Input() usuarioId: string | null = null;
  @Input() aliasUsuario = '';

  @Output() cerrar = new EventEmitter<void>();

  data = signal<SesionesResp | null>(null);
  error = signal('');
  cargando = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['usuarioId']) {
      const nuevo = changes['usuarioId'].currentValue as string | null;
      if (nuevo) {
        this.load(nuevo);        // 🔁 carga automática al cambiar el usuario
      } else {
        this.data.set(null);
        this.error.set('');
        this.cdr.markForCheck();
      }
    }
  }

  recargar() {
    if (this.usuarioId) this.load(this.usuarioId);
  }

  private async load(uid: string) {
    this.cargando.set(true);
    this.error.set('');
    this.cdr.markForCheck();
    try {
      // Ajusta el endpoint si tu ruta difiere:
      // yo asumo: GET /api/admin/sesiones?usuarioId=...
      const params = new HttpParams().set('usuarioId', uid);
      const resp = await this.http.get<SesionesResp>(`${this.apiBase}/admin/sesiones`, { params }).toPromise();
      this.data.set(resp ?? { usuarioId: uid, total: 0, activas: 0, items: [] });
    } catch (e: any) {
      this.data.set(null);
      this.error.set(e?.error?.error || 'No se pudieron cargar las sesiones');
    } finally {
      this.cargando.set(false);
      this.cdr.markForCheck();
    }
  }

  trackById = (_: number, s: Sesion) => s._id;

  acortarUA(ua?: string) {
    if (!ua) return '—';
    return ua.length > 42 ? ua.slice(0, 42) + '…' : ua;
    }
}
