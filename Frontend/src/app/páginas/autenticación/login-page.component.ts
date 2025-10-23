import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../núcleos/servicios/auth.service';
import { environment } from '../../../environments/environment.development';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
  <section class="login contenedor">
    <h1>Iniciar sesión</h1>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
      <label class="campo">
        <span>Correo o nombre de usuario</span>
        <input type="text"
               name="identificador"
               autocomplete="username"
               placeholder="tu@email.com o Usuario123"
               formControlName="identificador"
               (keyup.enter)="onSubmit()" />
        <small class="error" *ngIf="form.controls.identificador.touched && form.controls.identificador.invalid">
          Ingresa tu correo o nombre de usuario.
        </small>
      </label>

      <label class="campo">
        <span>Contraseña</span>
        <input [type]="ver?'text':'password'"
               name="password"
               autocomplete="current-password"
               placeholder="********"
               formControlName="password"
               (keyup.enter)="onSubmit()" />
        <button type="button" class="btn-link" (click)="ver=!ver">{{ ver ? 'Ocultar' : 'Mostrar' }}</button>
        <small class="error" *ngIf="form.controls.password.touched && form.controls.password.invalid">
          Ingresa tu contraseña.
        </small>
      </label>

      <div class="acciones">
        <button type="submit"
                (click)="onSubmit()"
                [disabled]="cargando() || form.invalid">
          Entrar
        </button>
        <a href="#" (click)="abrirRecuperar($event)">¿Olvidaste tu contraseña?</a>
      </div>

      <p class="error" *ngIf="error()">{{ error() }}</p>
    </form>

    <!-- Modal Recuperación -->
    <div class="modal" *ngIf="mostrarRecuperar()">
      <div class="modal-content">
        <header class="modal-head">
          <h3>Recuperar contraseña</h3>
          <button class="btn-close" (click)="cerrarModal()">✕</button>
        </header>

        <div class="paso">
          <h4>Paso 1: solicita tu token</h4>
          <form (ngSubmit)="recuperarPassword()">
            <label class="campo">
              <span>Correo o nombre de usuario</span>
              <input [(ngModel)]="identificador"
                     [ngModelOptions]="{ standalone: true }"
                     name="rec_identificador"
                     required />
            </label>
            <div class="acciones">
              <button type="submit" [disabled]="cargando()">Solicitar token</button>
              <button type="button" (click)="cerrarModal()">Cancelar</button>
            </div>
          </form>
        </div>

        <div class="paso" *ngIf="tokenRecuperado">
          <h4>Paso 2: restablece tu contraseña</h4>
          <p class="ayuda">Token recibido (solo para pruebas):</p>
          <code class="token">{{ tokenRecuperado }}</code>

          <form (ngSubmit)="restablecerPassword()">
            <label class="campo">
              <span>Nueva contraseña</span>
              <input [(ngModel)]="nuevaPassword"
                     [ngModelOptions]="{ standalone: true }"
                     name="rec_nuevaPassword"
                     type="password"
                     required />
              <small class="hint">Mínimo 8, 1 mayúscula, 1 signo, sin espacios.</small>
            </label>
            <div class="acciones">
              <button type="submit" [disabled]="cargando()">Restablecer</button>
              <button type="button" (click)="cerrarModal()">Cerrar</button>
            </div>
          </form>
        </div>

        <p class="ok" *ngIf="ok()">{{ ok() }}</p>
        <p class="error" *ngIf="errorRec()">{{ errorRec() }}</p>
      </div>
    </div>
  </section>
  `,
  styles: [`
    .contenedor { max-width: 420px; margin: 2rem auto; }
    form { display:flex; flex-direction: column; gap:.75rem; }
    .campo { display:flex; flex-direction: column; gap:.35rem; }
    .acciones { display:flex; gap:.75rem; align-items:center; justify-content:space-between; }
    .btn-link { margin-left:.5rem; font-size:.85rem; }
    .error { color:#c62828; }
    .ok { color:#2e7d32; }
    .hint { color:#6b7280; font-size:.85rem; }
    .modal {
      position: fixed; inset:0; background: rgba(0,0,0,.5);
      display:flex; align-items:center; justify-content:center; padding: 1rem;
    }
    .modal-content {
      background:#fff; width: min(560px, 100%); border-radius:.5rem; padding:1rem; border:1px solid #e5e7eb;
      max-height: 85vh; overflow:auto;
    }
    .modal-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:.5rem; }
    .btn-close { font-size:1.1rem; }
    .paso { border-top:1px solid #f3f4f6; padding-top:.75rem; margin-top:.75rem; }
    .token { display:block; padding:.5rem; background:#f9fafb; border:1px solid #e5e7eb; border-radius:.35rem; margin:.25rem 0 .75rem; }
  `]
})
export class LoginPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  ver = false;
  cargando = signal(false);
  error = signal('');

  // Modal recuperación
  mostrarRecuperar = signal(false);
  identificador = '';
  tokenRecuperado = '';
  nuevaPassword = '';
  ok = signal('');
  errorRec = signal('');

  get apiBase() { return environment.apiBaseUrl; }

  form = this.fb.nonNullable.group({
    identificador: this.fb.nonNullable.control('', { validators: [Validators.required] }),
    password: this.fb.nonNullable.control('', { validators: [Validators.required] }),
  });

  ngOnInit(): void { /* no-op */ }

  async onSubmit() {
 
    this.error.set('');
    this.cargando.set(true);
    try {
      const { identificador, password } = this.form.getRawValue();
      await this.auth.login(identificador, password);
    } catch (e: any) {
      this.error.set(e?.error?.error || 'Credenciales inválidas');
    } finally {
      this.cargando.set(false);
    }
  }

  abrirRecuperar(ev: Event) {
    ev.preventDefault();
    this.errorRec.set('');
    this.ok.set('');
    this.identificador = '';
    this.tokenRecuperado = '';
    this.nuevaPassword = '';
    this.mostrarRecuperar.set(true);
  }

  cerrarModal() {
    this.mostrarRecuperar.set(false);
  }

  async recuperarPassword() {
    this.errorRec.set(''); this.ok.set(''); this.cargando.set(true);
    try {
      const resp: any = await this.http.post(`${this.apiBase}/password/recuperar`, { identificador: this.identificador }).toPromise();
      this.tokenRecuperado = resp?.token || '';
      this.ok.set('Token generado correctamente. Copia el token y establece tu nueva contraseña.');
    } catch (e: any) {
      this.errorRec.set(e?.error?.error || 'No se pudo generar token');
    } finally {
      this.cargando.set(false);
    }
  }

  async restablecerPassword() {
    this.errorRec.set(''); this.ok.set(''); this.cargando.set(true);
    try {
      await this.http.post(`${this.apiBase}/password/restablecer`, {
        token: this.tokenRecuperado,
        nuevaPassword: this.nuevaPassword
      }).toPromise();

      this.ok.set('Contraseña restablecida correctamente. Ya puedes iniciar sesión.');
      // Limpieza
      this.identificador = '';
      this.tokenRecuperado = '';
      this.nuevaPassword = '';
      this.mostrarRecuperar.set(false);
    } catch (e: any) {
      this.errorRec.set(e?.error?.error || 'No se pudo restablecer la contraseña');
    } finally {
      this.cargando.set(false);
    }
  }
}
