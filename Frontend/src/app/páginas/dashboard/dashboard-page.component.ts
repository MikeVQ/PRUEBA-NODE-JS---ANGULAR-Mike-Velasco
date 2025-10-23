import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';

type IndicadoresResp = {
  usuariosActivos: number;
  usuariosInactivos: number;
  usuariosBloqueados: number;
  sesionesActivas: number;
  intentosFallidos24h: number;
  topFallos: { usuarioId: string; fallos: number; username?: string; nombres?: string; apellidos?: string }[];
  fallosPorDia7d: { fecha: string; fallos: number }[];
};

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
  <section class="contenedor">
    <header class="toolbar">
      <h1 class="h1">Dashboard</h1>
    </header>

    <ng-container *ngIf="data() as d; else cargandoOError">
      <div class="grid grid-3">
        <div class="tarjeta">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:.9rem;color:#6b7280;">Usuarios activos</div>
              <div style="font-size:1.6rem;font-weight:800;">{{ d.usuariosActivos }}</div>
            </div>
            <span class="badge badge-ok">OK</span>
          </div>
        </div>

        <div class="tarjeta">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:.9rem;color:#6b7280;">Usuarios inactivos</div>
              <div style="font-size:1.6rem;font-weight:800;">{{ d.usuariosInactivos }}</div>
            </div>
            <span class="badge badge-warn">INACTIVO</span>
          </div>
        </div>

        <div class="tarjeta">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:.9rem;color:#6b7280;">Usuarios bloqueados</div>
              <div style="font-size:1.6rem;font-weight:800;">{{ d.usuariosBloqueados }}</div>
            </div>
            <span class="badge badge-danger">BLOQ</span>
          </div>
        </div>

        <div class="tarjeta">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:.9rem;color:#6b7280;">Sesiones activas</div>
              <div style="font-size:1.6rem;font-weight:800;">{{ d.sesionesActivas }}</div>
            </div>
            <span class="badge">LIVE</span>
          </div>
        </div>

        <div class="tarjeta">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:.9rem;color:#6b7280;">Intentos fallidos (24h)</div>
              <div style="font-size:1.6rem;font-weight:800;">{{ d.intentosFallidos24h }}</div>
            </div>
            <span class="badge badge-danger">FAIL</span>
          </div>
        </div>

        <div class="tarjeta">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="width:100%;">
              <div style="font-size:.9rem;color:#6b7280; display:flex; justify-content:space-between; align-items:center;">
                <span>Tendencia fallos (7 días)</span>
                <small style="color:#9ca3af;">máx: {{ maxY() }}</small>
              </div>

              <!-- Contenedor de barras -->
              <div
                style="display:flex; gap:.35rem; align-items:flex-end; height: 56px; overflow:hidden; padding-top:4px;">
                <ng-container *ngFor="let p of d.fallosPorDia7d">
                  <div
                    [title]="(p.fecha | date:'MMM d') + ': ' + p.fallos"
                    [style.height.px]="h(p.fallos)"
                    style="width:16px; background:#c7d2fe; border-radius:4px;">
                  </div>
                </ng-container>
              </div>
            </div>
            <span class="badge">7D</span>
          </div>
        </div>
      </div>

      <div class="tarjeta" *ngIf="d.topFallos?.length">
        <h3 style="margin:0 0 .5rem">Top fallos (7 días)</h3>
        <div class="tabla-wrapper">
          <table class="tabla">
            <thead>
              <tr>
                <th style="width:60px">#</th>
                <th>Usuario</th>
                <th>Nombre</th>
                <th>Fallos</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let t of d.topFallos; let i = index">
                <td>{{ i+1 }}</td>
                <td>{{ t.username || '—' }}</td>
                <td>{{ (t.nombres || '') + ' ' + (t.apellidos || '') }}</td>
                <td><span class="badge badge-danger">{{ t.fallos }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </ng-container>

    <ng-template #cargandoOError>
      <div class="tarjeta" *ngIf="!error(); else hayError">
        Cargando dashboard…
      </div>
      <ng-template #hayError>
        <div class="tarjeta error">
          {{ error() }}
        </div>
      </ng-template>
    </ng-template>
  </section>
  `
})
export class DashboardPageComponent implements OnInit {
  private http = inject(HttpClient);
  data = signal<IndicadoresResp | null>(null);
  error = signal('');
  Math = Math; // si quisieras usar Math.* desde el template
  private H = 56; // altura del área de barras (px)

  // máximo de la serie para escalar (al menos 1)
  maxY = computed(() => {
    const serie = this.data()?.fallosPorDia7d ?? [];
    const max = Math.max(0, ...serie.map(s => s.fallos));
    return Math.max(1, max);
  });

  // altura escalada y "clamp" para que nunca se salga del contenedor
  h(valor: number): number {
    const scaled = Math.round((valor / this.maxY()) * this.H);
    return Math.max(4, Math.min(this.H, scaled));
  }

  get apiBase() { return environment.apiBaseUrl; }

  async ngOnInit() {
    this.error.set('');
    try {
      const resp = await this.http.get<IndicadoresResp>(`${this.apiBase}/admin/indicadores`).toPromise();
      this.data.set(resp ?? null);
    } catch (e: any) {
      console.error('[dashboard] error', e);
      this.error.set(e?.error?.error || 'No se pudo cargar el dashboard');
    }
  }
}
