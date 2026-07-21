import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.services';
import { Auth } from '../auth/Auth';
import { LAENDER } from '../shared/laender';

const API_BASE = 'http://localhost:3000';

@Component({
  selector: 'app-profil-einrichten',
  imports: [CommonModule, FormsModule],
  templateUrl: './ProfilEinrichten.html',
  styleUrl: './ProfilEinrichten.css'
})
export class ProfilEinrichten implements OnInit {
  laender = LAENDER;

  benutzername = '';
  beschreibung = '';
  stadt = '';
  land = '';

  avatarPreview: string | null = null;
  private avatarFile: File | null = null;

  errorMessage = '';
  isSaving = false;

  constructor(private api: ApiService, private auth: Auth, private router: Router) {}

  ngOnInit(): void {
    const benutzer = this.auth.currentUser();
    if (!benutzer) return;

    // Bestehende Daten laden, falls diese Seite zum Bearbeiten statt
    // zum ersten Einrichten aufgerufen wird
    this.api.getUser(benutzer.user_Id).subscribe({
      next: (daten) => {
        this.benutzername = daten.Benutzername || '';
        this.beschreibung = daten.Beschreibung || '';

        if (daten.Profilbildpfad) {
          this.avatarPreview = `${API_BASE}/${daten.Profilbildpfad}`;
        }

        // "Stadt, Land" wieder in die zwei Felder auftrennen (bestmöglich -
        // falls das Format mal nicht exakt passt, bleiben die Felder leer)
        if (daten.Location) {
          const teile = daten.Location.split(',').map((t: string) => t.trim());
          this.stadt = teile[0] || '';
          if (teile[1] && this.laender.includes(teile[1])) {
            this.land = teile[1];
          }
        }
      },
      error: (err) => console.error('Profil konnte nicht geladen werden', err),
    });
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.avatarFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.avatarPreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  onSubmit(): void {
    this.errorMessage = '';

    const name = this.benutzername.trim();
    if (!name) {
      this.errorMessage = 'Bitte gib einen Benutzernamen ein.';
      return;
    }

    const benutzer = this.auth.currentUser();
    if (!benutzer) {
      this.errorMessage = 'Du bist nicht angemeldet.';
      return;
    }

    const formData = new FormData();
    formData.append('Benutzername', name);
    if (this.beschreibung.trim()) {
      formData.append('Beschreibung', this.beschreibung.trim());
    }

    // Stadt + Land zu einem String zusammensetzen, wie es in der
    // Location-Spalte gespeichert wird
    const stadtTrim = this.stadt.trim();
    if (stadtTrim && this.land) {
      formData.append('Location', `${stadtTrim}, ${this.land}`);
    } else if (stadtTrim) {
      formData.append('Location', stadtTrim);
    } else if (this.land) {
      formData.append('Location', this.land);
    }

    if (this.avatarFile) {
      formData.append('profilbild', this.avatarFile);
    }

    this.isSaving = true;

    this.api.completeProfile(benutzer.user_Id, formData).subscribe({
      next: (aktualisierterBenutzer) => {
        this.auth.setEingeloggt(aktualisierterBenutzer);
        this.isSaving = false;
        this.router.navigateByUrl('/');
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMessage = err.error?.error || 'Profil konnte nicht gespeichert werden.';
      },
    });
  }
}