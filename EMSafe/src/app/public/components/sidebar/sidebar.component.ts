import { Component, type OnInit, type OnDestroy } from "@angular/core"
import {CommonModule} from "@angular/common"
import { MatSidenavModule } from "@angular/material/sidenav"
import { MatListModule } from "@angular/material/list"
import { MatIconModule } from "@angular/material/icon"
import { MatDividerModule } from "@angular/material/divider"
import {NavigationEnd, Router, RouterModule} from "@angular/router"
import { TranslateModule } from "@ngx-translate/core"
import {filter, type Subscription } from "rxjs"
import  { SidebarService } from "../../../core/services/sidebar.service"

@Component({
  selector: "app-sidebar",
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatDividerModule,
    RouterModule,
    TranslateModule,
  ],
  templateUrl: "./sidebar.component.html",
  styleUrls: ["./sidebar.component.css"],
})
export class SidebarComponent implements OnInit, OnDestroy {
  opened = true
  private sidebarSubscription?: Subscription
  private routerSubscription?: Subscription


  menuItems = [
    {
      name: "MENU.DASHBOARD",
      icon: "home",
      route: "/dashboard",
    },
    {
      name: "MENU.DEVICE_HISTORY",
      icon: "history",
      route: "/devices/history",
    },
    {
      name: "MENU.DEVICE_MANAGEMENT",
      icon: "settings",
      route: "/devices/management",
    },
    {
      name: "MENU.ALARM_HISTORY",
      icon: "notifications",
      route: "/alarms/history",
    },
    {
      name: "MENU.RADIATION_MAP",
      icon: "map",
      route: "/map",
    },
  ]

  constructor(private sidebarService: SidebarService, private router: Router) {}

  ngOnInit() {
    this.routerSubscription = this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe((event: NavigationEnd) => {
          this.opened = !event.urlAfterRedirects.startsWith("/login")
        })
    this.sidebarSubscription = this.sidebarService.sidebarOpened$.subscribe((isOpen) => {
      this.opened = isOpen
    })

  }

  ngOnDestroy() {
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe()
      this.routerSubscription?.unsubscribe()
    }
  }
}
