import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { UsuariosService, UsuarioDto } from '../../núcleos/servicios/usuarios.service';
import { SesionesPanelComponent } from '../../componentes/sesiones-panel/sesiones-panel.component';

@Component({
  selector: 'app-usuarios-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SesionesPanelComponent],
  template: `
  <section class="contenedor">
    <header class="acciones">
      <h1>Gestión de Usuarios</h1>
      <div class="filtros">
        <input
          type="text"
          placeholder="Buscar (nombre, user, email, identificación)"
          [value]="q()"
          (keyup.enter)="onBuscar($any($event.target).value)"
          (input)="onBuscar($any($event.target).value)" />
        <button type="button" (click)="refrescarBusqueda()">Buscar</button>
        <button type="button" (click)="limpiarBusqueda()">Limpiar</button>
        <button type="button" (click)="nuevo()">+ Nuevo</button>
      </div>
    </header>

    <div class="tabla-wrapper" *ngIf="listado() as L">
      <table class="tabla">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Usuario</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Estado</th>
            <th style="width:220px">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let u of (L?.data || [])">
            <td>{{ u.nombres }} {{ u.apellidos }}</td>
            <td>{{ u.username }}</td>
            <td>{{ u.email }}</td>
            <td>{{ u.rol }}</td>
            <td>
              <span class="badge"
                    [class.badge-ok]="u.status==='ACTIVO'"
                    [class.badge-warn]="u.status==='INACTIVO'"
                    [class.badge-danger]="u.status==='BLOQUEADO'">
                {{ u.status }}
              </span>
            </td>
            <td class="acciones-td">
              <button (click)="verSesiones(u)">Sesiones</button>
              <button (click)="editar(u)">Editar</button>
              <button class="danger" (click)="eliminar(u)">Eliminar</button>
            </td>
          </tr>

          <tr *ngIf="!(L?.data?.length)">
            <td colspan="6" style="text-align:center; padding:1rem;">Sin resultados</td>
          </tr>
        </tbody>
      </table>

      <div class="paginado" *ngIf="(L?.total || 0) > (L?.limit || 10)">
        <button (click)="prev()" [disabled]="page()<=1">Anterior</button>
        <span>Página {{ page() }} de {{ totalPages() }}</span>
        <button (click)="next()" [disabled]="page()>=totalPages()">Siguiente</button>
      </div>
    </div>

    <!-- Panel de formulario -->
    <div class="panel" *ngIf="mostrarForm()">
      <h2>{{ editando() ? 'Editar usuario' : 'Nuevo usuario' }}</h2>
      <form [formGroup]="form" (ngSubmit)="guardar()" novalidate>
        <div class="grid">
          <div class="campo">
            <label>Nombres</label>
            <input formControlName="nombres" />
            <small class="error" *ngIf="form.controls.nombres.invalid && form.touched">Nombres requeridos</small>
          </div>

          <div class="campo">
            <label>Apellidos</label>
            <input formControlName="apellidos" />
            <small class="error" *ngIf="form.controls.apellidos.invalid && form.touched">Apellidos requeridos</small>
          </div>

          <div class="campo">
            <label>Identificación</label>
            <input formControlName="identificacion"
                   maxlength="10"
                   inputmode="numeric"
                   pattern="[0-9]*"
                   (input)="soloNumeros($event)" />
            <small class="error" *ngIf="form.controls.identificacion.touched && form.controls.identificacion.errors">
              <span *ngIf="form.controls.identificacion.errors['required']">Campo obligatorio.</span>
              <span *ngIf="form.controls.identificacion.errors['pattern']">Solo se permiten números.</span>
              <span *ngIf="form.controls.identificacion.errors['minlength'] || form.controls.identificacion.errors['maxlength']">
                Debe tener exactamente 10 dígitos.
              </span>
            </small>
          </div>

          <div class="campo">
            <label>Username</label>
            <input formControlName="username" />
            <small class="error" *ngIf="form.controls.username.invalid && form.touched">
              Username requerido (8-20, 1 mayúscula y 1 número, sin signos)
            </small>
          </div>

          <div class="campo">
            <label>Email</label>
            <input type="email" formControlName="email" placeholder="ejemplo@mail.com" />
            <small class="error" *ngIf="form.controls.email.touched && form.controls.email.errors?.['email']">
              Ingresa un correo válido (o déjalo vacío para autogenerar).
            </small>
          </div>

          <div class="campo" *ngIf="!editando()">
            <label>Contraseña</label>
            <input type="password" formControlName="password" />
            <small class="error" *ngIf="form.controls.password.invalid && form.touched">
              Contraseña requerida (mínimo 8, 1 mayúscula, 1 signo, sin espacios)
            </small>
          </div>

          <div class="campo">
            <label>Rol</label>
            <select formControlName="rolNombre">
              <option value="USUARIO">USUARIO</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          <div class="campo" *ngIf="editando()">
            <label>Estado</label>
            <select formControlName="status">
              <option value="ACTIVO">ACTIVO</option>
              <option value="INACTIVO">INACTIVO</option>
              <option value="BLOQUEADO">BLOQUEADO</option>
            </select>
          </div>
        </div>

        <div class="acciones-form">
          <button type="submit"
                  [disabled]="cargando() || form.invalid"
                  [class.desactivado]="form.invalid || cargando()">
            Guardar
          </button>
          <button type="button" (click)="cerrarForm()">Cancelar</button>
        </div>
        <p class="error" *ngIf="error()">{{ error() }}</p>
      </form>
    </div>

    <!-- Panel de Sesiones -->
    <div *ngIf="sesionesVisible() && usuarioSesionesId() as uid" style="margin-top:1rem;">
  <app-sesiones-panel
    [usuarioId]="uid"
    [aliasUsuario]="usuarioSesionesAlias()"
    (cerrar)="sesionesVisible.set(false); usuarioSesionesId.set(null)">
  </app-sesiones-panel>
</div>
  </section>
  `,
  styles: [`
    .contenedor { padding: 1rem; }
    .acciones { display:flex; justify-content:space-between; align-items:center; gap:1rem; margin-bottom: .75rem; }
    .filtros { display:flex; gap:.5rem; align-items:center; flex-wrap: wrap; }
    .filtros input { padding:.5rem .6rem; min-width: 320px; }
    .tabla-wrapper { background:#fff; border:1px solid #e5e7eb; border-radius:.5rem; }
    .tabla { width:100%; border-collapse: collapse; }
    .tabla th, .tabla td { border-bottom:1px solid #eee; padding:.5rem .6rem; text-align:left; }
    .acciones-td { display:flex; gap:.35rem; flex-wrap:wrap; }
    .badge { padding:.15rem .5rem; border-radius:.35rem; font-size:.8rem; }
    .badge-ok { background:#dcfce7; color:#166534; }
    .badge-warn { background:#fef3c7; color:#92400e; }
    .badge-danger { background:#fee2e2; color:#991b1b; }
    .paginado { display:flex; gap:1rem; align-items:center; justify-content:flex-end; padding:.5rem .6rem; }
    .panel { margin-top: 1rem; border:1px solid #e5e7eb; border-radius:.5rem; padding:1rem; background:#fafafa; }
    .grid { display:grid; grid-template-columns: repeat(3, 1fr); gap:.75rem; }
    .campo { display:flex; flex-direction:column; gap:.25rem; }
    .acciones-form { display:flex; gap:.5rem; margin-top:.75rem; }
    button { padding:.45rem .7rem; }
    button.danger { background:#fee2e2; color:#991b1b; border:1px solid #fecaca; }
    button[disabled], button.desactivado { opacity: 0.6; cursor: not-allowed; }
    .error { color:#c62828; margin-top:.5rem; }
    @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class UsuariosPageComponent implements OnInit {
  private svc = inject(UsuariosService);
  private fb = inject(FormBuilder);

  // estado de la tabla
  listado = signal<{ data: UsuarioDto[]; page: number; limit: number; total: number }>({ data: [], page: 1, limit: 10, total: 0 });
  page = signal(1);
  limit = signal(10);
  q = signal('');
  cargando = signal(false);
  error = signal('');

  // panel/form
  mostrarForm = signal(false);
  editando = signal(false);
  idEdit = signal<string | null>(null);

  // panel de sesiones
  sesionesVisible = signal(false);
  usuarioSesionesId = signal<string | null>(null);
  usuarioSesionesAlias = signal<string | null>(null);

  // Form nonNullable
  form = this.fb.nonNullable.group({
    nombres: this.fb.nonNullable.control('', { validators: [Validators.required] }),
    apellidos: this.fb.nonNullable.control('', { validators: [Validators.required] }),
    identificacion: this.fb.nonNullable.control('', {
      validators: [
        Validators.required,
        Validators.pattern(/^[0-9]*$/),
        Validators.minLength(10),
        Validators.maxLength(10)
      ]
    }),
    username: this.fb.nonNullable.control('', { validators: [Validators.required] }),
    email: this.fb.nonNullable.control('', { validators: [Validators.email] }), 
    password: this.fb.nonNullable.control(''),
    rolNombre: this.fb.nonNullable.control<'USUARIO' | 'ADMIN'>('USUARIO', { validators: [Validators.required] }),
    status: this.fb.nonNullable.control<'ACTIVO' | 'INACTIVO' | 'BLOQUEADO'>('ACTIVO')
  });

  totalPages = computed(() => Math.max(1, Math.ceil((this.listado().total || 0) / this.limit())));

  ngOnInit() { this.cargar(); }

  async cargar() {
    this.cargando.set(true);
    this.error.set('');
    try {
      const resp = await this.svc.listar(this.page(), this.limit(), this.q()).toPromise();
      const safe = (resp && Array.isArray(resp.data))
        ? resp
        : { data: [], page: this.page(), limit: this.limit(), total: 0 };
      this.listado.set(safe);
    } catch (e: any) {
      this.error.set(e?.error?.error || 'No se pudo cargar usuarios');
      this.listado.set({ data: [], page: this.page(), limit: this.limit(), total: 0 });
    } finally {
      this.cargando.set(false);
    }
  }

  // limpieza de input para números
  soloNumeros(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '');
    this.form.controls.identificacion.setValue(input.value);
  }

  // búsqueda
  onBuscar(text: string) {
    this.q.set((text || '').trim());
    this.page.set(1);
    this.cargar();
  }
  refrescarBusqueda() { this.page.set(1); this.cargar(); }
  limpiarBusqueda() {
    this.q.set('');
    this.page.set(1);
    this.cargar();
  }

  // paginado
  prev() { if (this.page() > 1) { this.page.update(p => p - 1); this.cargar(); } }
  next() { if (this.page() < this.totalPages()) { this.page.update(p => p + 1); this.cargar(); } }

  // CRUD
  nuevo() {
    this.form.reset({
      nombres: '', apellidos: '', identificacion: '', username: '',
      email: '', password: '', rolNombre: 'USUARIO', status: 'ACTIVO'
    });
    this.idEdit.set(null);
    this.editando.set(false);
    this.mostrarForm.set(true);
  }

  async editar(u: UsuarioDto) {
    this.form.reset({
      nombres: u.nombres,
      apellidos: u.apellidos,
      identificacion: u.identificacion,
      username: u.username,
      email: u.email || '',
      password: '', 
      rolNombre: (u.rol === 'ADMIN' ? 'ADMIN' : 'USUARIO'),
      status: u.status,
    });
    this.idEdit.set(u.id);
    this.editando.set(true);
    this.mostrarForm.set(true);
  }

  cerrarForm() {
    this.mostrarForm.set(false);
    this.idEdit.set(null);
    this.editando.set(false);
    this.form.reset();
  }

  async guardar() {
    this.form.markAllAsTouched();
    if (this.form.invalid) { this.error.set('Revisa los campos resaltados antes de continuar'); return; }

    this.cargando.set(true);
    this.error.set('');
    try {
      const raw = this.form.getRawValue();

      if (this.editando() && this.idEdit()) {
        const { password, ...rest } = raw;

        const cambios: Partial<{
          nombres: string; apellidos: string; identificacion: string;
          username: string; status: 'ACTIVO'|'INACTIVO'|'BLOQUEADO';
          rolNombre: 'USUARIO'|'ADMIN'; email: string;
        }> = {};

        (['nombres','apellidos','identificacion','username','status','rolNombre','email'] as const).forEach(k => {
          const v = (rest as any)[k];
          if (v !== '') (cambios as any)[k] = v;
        });

        if (password && password !== '') (cambios as any).password = password;

        await this.svc.actualizar(this.idEdit()!, cambios).toPromise();
      } else {
       
        if (!raw.password) { this.error.set('La contraseña es requerida para crear'); this.cargando.set(false); return; }
        await this.svc.crear(raw as any).toPromise();
        await this.cargar();
        this.cerrarForm();
      }

      this.cerrarForm();
      this.cargar();
    } catch (e: any) {
      const msg = e?.error?.error || 'No se pudo guardar';
      this.error.set(msg);
    } finally {
      this.cargando.set(false);
    }
  }

  async eliminar(u: UsuarioDto) {
    if (!confirm(`¿Eliminar lógicamente a ${u.username}?`)) return;
    this.cargando.set(true);
    this.error.set('');
    try {
      await this.svc.eliminar(u.id).toPromise();
      this.cargar();
    } catch (e: any) {
      this.error.set(e?.error?.error || 'No se pudo eliminar');
    } finally {
      this.cargando.set(false);
    }
  }

  // Sesiones
  verSesiones(u: UsuarioDto) {
    this.usuarioSesionesId.set(u.id);
    this.usuarioSesionesAlias.set(`${u.nombres} ${u.apellidos} (${u.username})`);
    this.sesionesVisible.set(true);
  }
}
