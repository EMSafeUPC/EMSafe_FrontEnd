import { Component } from '@angular/core';
import {MatButtonToggle, MatButtonToggleGroup} from '@angular/material/button-toggle';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-language-switcher',
  imports: [
    MatButtonToggleGroup,
    MatButtonToggle,

  ],
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.css'
})
export class LanguageSwitcherComponent {

  protected currentLang: string='en';
  protected languages: string[]=['en','es'];


  constructor(private translate: TranslateService) {
    this.currentLang=this.translate.currentLang
  }

  useLanguages(languages:string):void {
    this.translate.use(languages);
    this.currentLang=languages;
  }
}
