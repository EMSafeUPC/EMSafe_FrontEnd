import { Component, OnInit, AfterViewInit, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatTableModule, MatTableDataSource } from "@angular/material/table";
import { MatPaginatorModule, MatPaginator } from "@angular/material/paginator";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";

import { TranslateModule } from "@ngx-translate/core";
import { DataService } from "../../../../core/services/data.service";
import { AlarmsHistoryAddDialogComponent } from "./alarms-history-add-dialog/alarms-history-add-dialog.component";

/* Payload de la alarma que envía el modal */
interface AlarmPayload {
  device: { id: number };
  type: string;
  level: string;
  reading: number;
  threshold: number;
  unit: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
  resolved: boolean;
  resolvedAt: string | null;
  notes: string;
}

@Component({
  selector: "app-alarms-history",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonToggleModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDialogModule,
    TranslateModule,
  ],
  templateUrl: "./alarms-history.component.html",
  styleUrls: ["./alarms-history.component.css"],
})
export class AlarmsHistoryComponent implements OnInit, AfterViewInit {
  /* ─────────── tabla ─────────── */
  displayedColumns = [
    "id",
    "deviceName",
    "level",
    "timestamp",
    "status",
    "actions",
  ];
  fullData: any[] = [];
  dataSource = new MatTableDataSource<any>([]);

  /* filtros */
  filtro: "all" | "active" | "resolved" = "all";
  searchText = "";

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private dataService: DataService, private dialog: MatDialog) {}

  /* ─────────── ciclo de vida ─────────── */

ngOnInit(): void {
  this.dataService.getAlarmHistory().subscribe((datos) => {
    this.fullData = datos;
    this.aplicarFiltro();

    /* 💡 en cuanto tengas los datos, vincula de nuevo el paginator */
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
      this.paginator.firstPage();
    }
  });
}

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    /* etiqueta + opciones */
    this.paginator._intl.itemsPerPageLabel = "Filas por página";
    this.paginator.pageSize = 5;
    (this.paginator as any)._pageSizeOptions = [5, 10, 20];

    this.aplicarFiltro();
  }

  /* ─────────── filtros ─────────── */

  onFiltroChange(v: "all" | "active" | "resolved") {
    this.filtro = v;
    this.aplicarFiltro();
  }

  onSearchChange(text: string) {
    this.searchText = text;
    this.aplicarFiltro();
  }

  private aplicarFiltro(): void {
    let filtrados = this.fullData;

    /* estado */
    if (this.filtro === "active")
      filtrados = filtrados.filter((r) => !r.resolved);
    else if (this.filtro === "resolved")
      filtrados = filtrados.filter((r) => r.resolved);

    /* búsqueda */
    if (this.searchText.trim()) {
      const term = this.searchText.toLowerCase();
      filtrados = filtrados.filter(
        (r) =>
          r.deviceName.toLowerCase().includes(term) ||
          r.id.toString().includes(term)
      );
    }

    /* actualiza tabla */
    this.dataSource.data = filtrados;

    /* 🔄 vuelve a la primera página y re-conecta paginator */
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
      this.paginator.firstPage();
    }
  }

  /* ─────────── CRUD ─────────── */

  agregarAlarma(): void {
    const ref = this.dialog.open(AlarmsHistoryAddDialogComponent, {
      width: "600px",
    });

    ref.afterClosed().subscribe((payload: AlarmPayload | undefined) => {
      if (!payload) return; // cancelado

      this.dataService.createAlarm(payload).subscribe({
        next: (nueva) => {
          this.fullData.unshift(nueva);
          this.aplicarFiltro();
        },
        error: () => alert("Error al crear la alarma"),
      });
    });
  }

  exportar(): void {
    console.log("Exportar", this.dataSource.data);
  }
}
