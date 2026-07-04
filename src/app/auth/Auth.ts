import { Injectable, signal } from '@angular/core';
import { ApiService } from '../services/api.services';

// So sieht ein Benutzer aus, wie ihn das Backend beim Login zurückgibt
export interface AktuellerBenutzer {
  user_Id: number;
  Benutzername: string;
  Email: string;
}

@Injectable({ providedIn: 'root' })
export class Auth {
  isLoggedIn = signal(false);
  currentUser = signal<AktuellerBenutzer | null>(null);

  constructor(private api: ApiService) {
    // Beim Neuladen der Seite prüfen, ob vorher schon jemand eingeloggt war
    const gespeichert = localStorage.getItem('currentUser');
    if (gespeichert) {
      this.currentUser.set(JSON.parse(gespeichert));
      this.isLoggedIn.set(true);
    }
  }

  // Gibt ein Observable zurück – die Komponente entscheidet, was bei
  // Erfolg/Fehler passiert (z.B. weiterleiten oder Fehlermeldung zeigen).
  login(email: string, password: string) {
    return this.api.login({ Email: email, Passwort: password });
  }

  // Wird von der Login-Komponente aufgerufen, NACHDEM die API erfolgreich geantwortet hat
  setEingeloggt(benutzer: AktuellerBenutzer): void {
    this.currentUser.set(benutzer);
    this.isLoggedIn.set(true);
    localStorage.setItem('currentUser', JSON.stringify(benutzer));
  }

  logout(): void {
    this.currentUser.set(null);
    this.isLoggedIn.set(false);
    localStorage.removeItem('currentUser');
  }
}