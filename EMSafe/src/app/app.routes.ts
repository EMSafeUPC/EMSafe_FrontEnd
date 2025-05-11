import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./public/pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
    },
    {
        path: 'devices/history',
        loadComponent: () => import('./public/pages/devices/devices-history/devices-history.component').then(m => m.DevicesHistoryComponent)
    },
    {
        path: 'devices/management',
        loadComponent: () => import('./public/pages/devices/devices-management/devices-management.component').then(m => m.DevicesManagementComponent)
    },
    {
        path: 'alarms/history',
        loadComponent: () => import('./public/pages/alarms/alarms-history/alarms-history.component').then(m => m.AlarmsHistoryComponent)
    },
    {
        path: 'alarms/settings',
        loadComponent: () => import('./public/pages/alarms/alarms-settings/alarms-settings.component').then(m => m.AlarmsSettingsComponent)
    },
    {
        path: 'map',
        loadComponent: () => import('./public/pages/map/map.component').then(m => m.MapComponent)
    },
    {
        path: 'profile',
        loadComponent: () => import('./public/pages/profile/profile.component').then(m => m.ProfileComponent)
    },
    {
        path: 'login',
        loadComponent: () => import('./public/pages/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'settings',
        loadComponent: () => import('./public/pages/settings/settings.component').then(m => m.SettingsComponent)
    },
    {
        path: '**',
        redirectTo: 'dashboard'
    }
];
