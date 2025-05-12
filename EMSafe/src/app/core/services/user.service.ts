import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = 'http://localhost:3000'; // URL de json-server

    constructor(private http: HttpClient) {}

    updateUserProfile(userId: number, profileData: any): Observable<any> {

        return of({ success: true, data: profileData }).pipe(delay(1000));
    }

    updateUserPreferences(userId: number, preferences: any): Observable<any> {

        return of({ success: true, data: preferences }).pipe(delay(1000));
    }

    changePassword(userId: number, currentPassword: string, newPassword: string): Observable<any> {

        if (currentPassword === 'wrongpassword') {
            return throwError(() => ({ status: 401, message: 'Current password is incorrect' })).pipe(delay(1000));
        }
        return of({ success: true }).pipe(delay(1000));
    }

    terminateSession(sessionId: number): Observable<any> {

        return of({ success: true }).pipe(delay(500));
    }

    terminateAllSessions(userId: number): Observable<any> {

        return of({ success: true }).pipe(delay(1000));
    }
}