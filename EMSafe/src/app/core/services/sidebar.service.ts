import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SidebarService {
    private _sidebarOpenedSubject = new BehaviorSubject<boolean>(true);
    sidebarOpened$ = this._sidebarOpenedSubject.asObservable();

    toggleSidebar() {
        this._sidebarOpenedSubject.next(!this._sidebarOpenedSubject.value);
    }

    setSidebarState(isOpen: boolean) {
        this._sidebarOpenedSubject.next(isOpen);
    }
}
