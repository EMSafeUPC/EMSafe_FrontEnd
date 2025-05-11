import { Component } from '@angular/core';
import {RouterOutlet, Routes} from '@angular/router';
import {HeaderComponent} from './public/components/header/header.component';
import {SidebarComponent} from './public/components/sidebar/sidebar.component';
import {CommonModule} from '@angular/common';
import {TranslateService} from '@ngx-translate/core';


@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'EMSafe';

  constructor(private translate: TranslateService) {
    // Configurar idioma por defecto
    translate.setDefaultLang('en');

    // Usar el idioma del navegador si está disponible, de lo contrario usar el predeterminado
    const browserLang = translate.getBrowserLang();
    translate.use(browserLang?.match(/en|es/) ? browserLang : 'en');
  }


}
