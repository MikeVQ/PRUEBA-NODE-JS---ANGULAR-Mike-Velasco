import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MenuService } from '../núcleos/servicios/menu.service';
import { AuthService } from '../núcleos/servicios/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
  <div class="layout">
    <aside class="sidebar">
      <h3 class="brand">Mi App</h3>

      <!-- Usuario actual -->
      <div class="usuario-box" *ngIf="auth.usuario() as u">
        <div style="font-weight:700">
          {{ u.username }} <small style="opacity:.8">({{ u.rol }})</small>
        </div>
        <span class="badge"
              [class.badge-ok]="u.status==='ACTIVO'"
              [class.badge-warn]="u.status==='INACTIVO'"
              [class.badge-danger]="u.status==='BLOQUEADO'">
          {{ u.status }}
        </span>
      </div>

      <!-- Menú desde servicio -->
      <nav class="menu" *ngIf="menu.items() as items">
        <a *ngFor="let item of items"
           class="menu-item"
           [routerLink]="item.ruta"
           routerLinkActive="active">
          <span class="icon" *ngIf="item.icono">{{ item.icono }}</span>
          <span>{{ item.texto }}</span>
        </a>
        <div *ngIf="!items.length" class="vacio" style="color:#9ca3af; font-size:.9rem; padding:.45rem .6rem;">
          Sin opciones de menú
        </div>
      </nav>

      <button class="btn-danger" (click)="logout()">Cerrar sesión</button>
    </aside>

    <main class="contenido">
      <router-outlet></router-outlet>
    </main>
  </div>
  `
})
export class LayoutComponent implements OnInit {
  menu = inject(MenuService);
  auth = inject(AuthService);

  async ngOnInit() {
    // Construye el menú según el rol actual al montar el layout (útil tras refresh del navegador)
    const rolActual = (this.auth.rol() ?? 'USUARIO') as 'ADMIN' | 'USUARIO';
    await this.menu.rebuild(rolActual);
  }

  async logout() {
    await this.auth.logout();
  }
}
