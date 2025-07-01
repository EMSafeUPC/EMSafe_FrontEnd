import { Component } from "@angular/core";
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  FormGroup,
} from "@angular/forms";
import { MatDialogRef, MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { CommonModule } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";

@Component({
  standalone: true,
  selector: "app-alarms-history-add-dialog",
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title class="dlg-title">Nueva alarma</h2>

    <mat-dialog-content class="dlg-content">
      <form class="grid" [formGroup]="form">
        <mat-form-field appearance="outline">
          <mat-label>ID dispositivo</mat-label>
          <input matInput type="number" formControlName="deviceId" required />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Tipo</mat-label>
          <input matInput formControlName="type" required />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Nivel</mat-label>
          <input matInput formControlName="level" required />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Lectura</mat-label>
          <input
            matInput
            type="number"
            step="0.01"
            formControlName="reading"
            required
          />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Umbral</mat-label>
          <input
            matInput
            type="number"
            step="0.01"
            formControlName="threshold"
            required
          />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Unidad</mat-label>
          <input matInput formControlName="unit" required />
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="dlg-actions">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button
        mat-flat-button
        color="primary"
        (click)="guardar()"
        [disabled]="form.invalid"
      >
        Guardar
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 600px;
        width: 100%;
      }
      .dlg-title {
        font-weight: 700;
        color: #3949ab;
      }
      .dlg-content {
        max-height: 70vh;
        overflow: auto;
      }

      /* ===== grid de 2 columnas (responsive) ===== */
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px 16px;
        padding: 8px 4px 4px;
      }
      mat-form-field {
        width: 100%;
      }

      .dlg-actions {
        padding: 8px 0 12px;
      }
    `,
  ],
})
export class AlarmsHistoryAddDialogComponent {

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private ref: MatDialogRef<AlarmsHistoryAddDialogComponent>
  ) {
    // Ahora fb ya está disponible
    this.form = this.fb.group({
      deviceId:    ['', Validators.required],
      type:        ['radiation_threshold', Validators.required],
      level:       ['warning', Validators.required],
      reading:     [0, Validators.required],
      threshold:   [0, Validators.required],
      unit:        ['μSv/h', Validators.required],
    });
  }

  guardar(): void {
    const v = this.form.value;
    this.ref.close({
      device: { id: Number(v.deviceId) },
      type: v.type,
      level: v.level,
      reading: Number(v.reading),
      threshold: Number(v.threshold),
      unit: v.unit,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      acknowledgedBy: null,
      acknowledgedAt: null,
      resolved: false,
      resolvedAt: null,
      notes: "",
    });
  }
}
