import { Injectable, signal, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ApiService } from '../services/api.services';

// So sieht ein Benutzer aus, wie ihn das Backend zurückgibt.
// Benutzername ist bewusst nullable - null heißt "Profil-Setup steht noch aus".
export interface AktuellerBenutzer {
  user_Id: number;
  Benutzername: string | null;
  Email: string;
  Beschreibung?: string | null;
  Profilbildpfad?: string | null;
}

@Injectable({ providedIn: 'root' })
export class Auth {
  isLoggedIn = signal(false);
  currentUser = signal<AktuellerBenutzer | null>(null);
  private isBrowser: boolean;

  constructor(
    private api: ApiService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      const gespeichert = localStorage.getItem('currentUser');
      if (gespeichert) {
        this.currentUser.set(JSON.parse(gespeichert));
        this.isLoggedIn.set(true);
      }
    }
  }

  login(email: string, password: string) {
    return this.api.login({ Email: email, Passwort: password });
  }

  register(email: string, password: string) {
    return this.api.register({ Email: email, Passwort: password });
  }

  // Wird nach erfolgreichem Login ODER erfolgreicher Registrierung
  // ODER nach Profil-Setup aufgerufen - aktualisiert immer den gespeicherten Stand.
  setEingeloggt(benutzer: AktuellerBenutzer): void {
    this.currentUser.set(benutzer);
    this.isLoggedIn.set(true);
    if (this.isBrowser) {
      localStorage.setItem('currentUser', JSON.stringify(benutzer));
    }
  }

  // Praktisch fürs Route-Guard: true, wenn eingeloggt aber Benutzername fehlt
  benoetigtProfilSetup(): boolean {
    const user = this.currentUser();
    return this.isLoggedIn() && !!user && !user.Benutzername;
  }

  logout(): void {
    this.currentUser.set(null);
    this.isLoggedIn.set(false);
    if (this.isBrowser) {
      localStorage.removeItem('currentUser');
    }
  }
}