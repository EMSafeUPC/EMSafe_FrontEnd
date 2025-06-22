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
import { TranslateModule } from "@ngx-translate/core";
import { DataService } from "../../../../core/services/data.service";

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
    TranslateModule,
  ],
  templateUrl: "./alarms-history.component.html",
  styleUrls: ["./alarms-history.component.css"],
})
export class AlarmsHistoryComponent implements OnInit, AfterViewInit {
  // Columnas de la tabla
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
  filtro: "all" | "active" | "resolved" = "all";
  searchText: string = "";

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.dataService.getAlarmHistory().subscribe((datos: any[]) => {
      this.fullData = datos;
      this.aplicarFiltro();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  onFiltroChange(valor: "all" | "active" | "resolved"): void {
    this.filtro = valor;
    this.aplicarFiltro();
  }

  onSearchChange(text: string): void {
    this.searchText = text;
    this.aplicarFiltro();
  }

  private aplicarFiltro(): void {
    let filtrados = this.fullData;

    // Filtro por estado
    if (this.filtro === "active") {
      filtrados = filtrados.filter((r) => r.status === "active");
    } else if (this.filtro === "resolved") {
      filtrados = filtrados.filter((r) => r.status === "resolved");
    }

    // Filtro de búsqueda
    if (this.searchText.trim()) {
      const term = this.searchText.toLowerCase();
      filtrados = filtrados.filter(
        (r) =>
          r.deviceName.toLowerCase().includes(term) ||
          r.id.toString().includes(term)
      );
    }

    this.dataSource.data = filtrados;
  }

  exportar(): void {
    console.log("Exportar", this.dataSource.data);
  }
}
