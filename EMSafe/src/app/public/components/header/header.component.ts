import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SidebarService } from '../../../core/services/sidebar.service';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { MatDivider } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from "../../../core/services/auth.service";
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    RouterModule,
    TranslateModule,
    LanguageSwitcherComponent,
    MatDivider
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  user: any = null;
  private userSubscription: Subscription | null = null;

  constructor(
      private sidebarService: SidebarService,
      private authService: AuthService,
      private router: Router
  ) {}

  ngOnInit(): void {
    // Obtener el usuario actual
    this.user = this.authService.getCurrentUser();

    // Suscribirse a los cambios en el usuario autenticado
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
  }

  ngOnDestroy(): void {
    // Cancelar la suscripción para evitar memory leaks
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  toggleSidebar() {
    this.sidebarService.toggleSidebar();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
