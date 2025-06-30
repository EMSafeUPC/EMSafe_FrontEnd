import { Routes } from '@angular/router';
import { AuthGuard } from "./core/guards/auth.guard";

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./public/pages/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'register',
        loadComponent: () => import('./public/pages/register/register.component').then(m => m.RegisterComponent)
    },
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./public/pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [AuthGuard]
    },
    {
        path: 'devices/history',
        loadComponent: () => import('./public/pages/devices/devices-history/devices-history.component').then(m => m.DevicesHistoryComponent),
        canActivate: [AuthGuard]
    },
    {
        path: 'devices/management',
        loadComponent: () => import('./public/pages/devices/devices-management/devices-management.component').then(m => m.DevicesManagementComponent),
        canActivate: [AuthGuard]
    },
    {
        path: 'alarms/history',
        loadComponent: () => import('./public/pages/alarms/alarms-history/alarms-history.component').then(m => m.AlarmsHistoryComponent),
        canActivate: [AuthGuard]
    },
    {
        path: 'alarms/settings',
        loadComponent: () => import('./public/pages/alarms/alarms-settings/alarms-settings.component').then(m => m.AlarmsSettingsComponent),
        canActivate: [AuthGuard]
    },
    {
        path: 'map',
        loadComponent: () => import('./public/pages/map/map.component').then(m => m.MapComponent),
        canActivate: [AuthGuard]
    },
    {
        path: 'profile',
        loadComponent: () => import('./public/pages/profile/profile.component').then(m => m.ProfileComponent),
        canActivate: [AuthGuard]
    },
    {
        path: 'settings',
        loadComponent: () => import('./public/pages/settings/settings.component').then(m => m.SettingsComponent),
        canActivate: [AuthGuard]
    },
    {
        path: '**',
        redirectTo: 'login'
    }
];
