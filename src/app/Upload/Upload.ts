import { Component, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import * as exifr from 'exifr';
import { ApiService } from '../services/api.services';
import { Auth } from '../auth/Auth';
import { LAENDER } from '../shared/laender';

interface Kategorie {
  KategorieID: number;
  Name: string;
}

@Component({
  selector: 'app-upload',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './Upload.html',
  styleUrl: './Upload.css'
})
export class UploadPage implements OnInit {
  isDragging = false;
  previewUrl: string | null = null;
  fileName: string | null = null;
  selectedFile: File | null = null;

  title = '';
  description = '';
  categoryId: number | null = null;

  // Location jetzt als Stadt (Freitext) + Land (Dropdown), statt einem
  // einzelnen Freitextfeld - genau wie beim Profil-Setup
  stadt = '';
  land = '';
  laender = LAENDER;

  iso = '';
  aperture = '';
  shutter = '';
  cameraBody = '';
  lens = '';
  tags: string[] = [];
  tagInput = '';

  // Zeigt kurz an, dass Kamera-Daten automatisch aus dem Bild übernommen wurden
  exifAutoFilled = false;

  private readonly MAX_DATEIGROESSE = 15 * 1024 * 1024; // 15 MB
  private readonly ERLAUBTE_TYPEN = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  categories = signal<Kategorie[]>([]);
  errorMessage = '';
  isSubmitting = false; // verhindert Doppel-Klicks während des Uploads

  constructor(
    private api: ApiService,
    private auth: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.api.getCategories().subscribe({
      next: (daten) => this.categories.set(daten),
      error: (err) => console.error('Kategorien konnten nicht geladen werden', err),
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(): void {
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  private handleFile(file: File): void {
    this.errorMessage = '';

    // Dateityp prüfen
    if (!this.ERLAUBTE_TYPEN.includes(file.type)) {
      this.errorMessage = 'Nicht unterstütztes Format. Erlaubt sind JPEG, PNG, GIF oder WebP.';
      return;
    }

    // Dateigröße prüfen
    if (file.size > this.MAX_DATEIGROESSE) {
      const groesseInMB = (file.size / (1024 * 1024)).toFixed(1);
      this.errorMessage = `Datei ist zu groß (${groesseInMB} MB). Maximal 15 MB erlaubt.`;
      return;
    }

    // Alte Vorschau-URL freigeben, bevor eine neue erstellt wird (verhindert Memory-Leak)
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }

    this.fileName = file.name;
    this.selectedFile = file;
    this.exifAutoFilled = false;

    // Felder zurücksetzen, falls vorher schon ein anderes Bild gewählt war -
    // sonst blockieren alte Werte das Auto-Ausfüllen der neuen Datei
    this.iso = '';
    this.aperture = '';
    this.shutter = '';
    this.cameraBody = '';
    this.lens = '';
    this.stadt = '';
    this.land = '';

    // createObjectURL statt FileReader.readAsDataURL - deutlich schneller,
    // da nicht das komplette Bild in Base64 umgewandelt werden muss
    this.previewUrl = URL.createObjectURL(file);

    // EXIF-Daten laufen unabhängig von der Vorschau - läuft im Hintergrund,
    // Nutzer kann die Felder trotzdem sofort von Hand ausfüllen
    this.autoFillFromExif(file);
  }

  // Liest Kamera-Metadaten UND GPS-Position direkt aus der Bilddatei aus und
  // befüllt die Formularfelder automatisch. Funktioniert nur, wenn die Datei
  // tatsächlich EXIF-Daten enthält (z.B. Original-Fotos von Kamera/Handy -
  // bei Screenshots oder bereits bearbeiteten/exportierten Bildern oft leer).
  private async autoFillFromExif(file: File): Promise<void> {
    try {
      const daten = await exifr.parse(file, {
        tiff: true,
        exif: true,
        gps: true,      // für die Standort-Auto-Erkennung
        ifd1: false,     // Thumbnail - brauchen wir nicht, spart Zeit
        interop: false,
        icc: false,
        iptc: false,
        jfif: false,
        xmp: false,
        pick: [
          'Make', 'Model', 'LensModel', 'FNumber', 'ISO', 'ExposureTime',
          'latitude', 'longitude',
        ],
      });

      if (!daten) return;

      let gefunden = false;

      // Bei jedem Feld: nur übernehmen, wenn der Nutzer nicht in der
      // Zwischenzeit schon selbst was eingetragen hat
      if (daten.ISO && !this.iso) {
        this.iso = String(daten.ISO);
        gefunden = true;
      }
      if (daten.FNumber && !this.aperture) {
        this.aperture = `f/${daten.FNumber}`;
        gefunden = true;
      }
      if (daten.ExposureTime && !this.shutter) {
        this.shutter = this.formatiereVerschlusszeit(daten.ExposureTime);
        gefunden = true;
      }
      if ((daten.Make || daten.Model) && !this.cameraBody) {
        this.cameraBody = [daten.Make, daten.Model].filter(Boolean).join(' ');
        gefunden = true;
      }
      if (daten.LensModel && !this.lens) {
        this.lens = daten.LensModel;
        gefunden = true;
      }

      this.exifAutoFilled = gefunden;

      // Zwingt Angular dazu, die Formularfelder neu zu zeichnen - nötig,
      // weil diese Werte aus einem async-Callback kommen
      this.cdr.detectChanges();

      // Falls GPS-Koordinaten im Bild stecken, versuchen wir daraus
      // Stadt + Land herauszufinden (läuft separat, da ein zusätzlicher
      // externer Request nötig ist)
      if (daten.latitude && daten.longitude) {
        this.reverseGeocodeVonExif(daten.latitude, daten.longitude);
      }
    } catch (err) {
      console.log('Keine EXIF-Daten in dieser Datei gefunden', err);
    }
  }

  // Wandelt GPS-Koordinaten in Stadt + Land um, per kostenloser
  // OpenStreetMap-Nominatim-API (kein API-Key nötig).
  private async reverseGeocodeVonExif(lat: number, lon: number): Promise<void> {
    try {
      const antwort = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=de`
      );
      const daten = await antwort.json();
      const adresse = daten?.address;
      if (!adresse) return;

      // Nur übernehmen, wenn der Nutzer nicht schon selbst was eingetragen hat
      if (!this.stadt) {
        const ort = adresse.city || adresse.town || adresse.village || adresse.municipality || adresse.county;
        if (ort) this.stadt = ort;
      }

      if (!this.land && adresse.country) {
        // Muss exakt mit einem Eintrag aus unserer Länderliste übereinstimmen,
        // sonst bleibt das Dropdown lieber leer statt einen falschen Wert zu zeigen
        const treffer = this.laender.find(
          (l) => l.toLowerCase() === adresse.country.toLowerCase()
        );
        if (treffer) this.land = treffer;
      }

      this.cdr.detectChanges();
    } catch (err) {
      console.log('Standort konnte nicht automatisch bestimmt werden', err);
    }
  }

  // Wandelt z.B. 0.004 (Sekunden) in "1/250" um, oder 2 in "2s"
  private formatiereVerschlusszeit(exposureTime: number): string {
    if (exposureTime >= 1) {
      return `${exposureTime}s`;
    }
    const nenner = Math.round(1 / exposureTime);
    return `1/${nenner}`;
  }

  removePreview(): void {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }
    this.previewUrl = null;
    this.fileName = null;
    this.selectedFile = null;
    this.exifAutoFilled = false;
  }

  addTag(): void {
    const value = this.tagInput.trim();
    if (value && !this.tags.includes(value)) {
      this.tags.push(value);
    }
    this.tagInput = '';
  }

  removeTag(tag: string): void {
    this.tags = this.tags.filter((t) => t !== tag);
  }

  // Entfernt alles außer Ziffern und Trennzeichen (z.B. "f/2,8" -> "2.8")
  // So ist es egal, ob jemand "2.8", "2,8" oder "f/2.8" eintippt.
  private nurZahl(wert: string): string {
    if (!wert) return '';
    return wert
      .replace(',', '.')       // Komma -> Punkt
      .replace(/[^0-9.]/g, ''); // alles außer Ziffern und Punkt entfernen
  }

  onPublish(): void {
    this.errorMessage = '';

    const benutzer = this.auth.currentUser();
    if (!benutzer) {
      this.errorMessage = 'Du musst eingeloggt sein, um ein Foto hochzuladen.';
      return;
    }
    if (!this.title.trim()) {
      this.errorMessage = 'Bitte gib einen Titel ein.';
      return;
    }
    if (!this.selectedFile) {
      this.errorMessage = 'Bitte wähle ein Foto aus.';
      return;
    }

    this.isSubmitting = true;

    const formData = new FormData();
    formData.append('user_Id', String(benutzer.user_Id));
    formData.append('Titel', this.title.trim());
    formData.append('Beschreibung', this.description?.trim() || '');
    formData.append('Datum', new Date().toISOString().slice(0, 10));

    // Stadt + Land zu einem String zusammensetzen für die Location-Spalte
    const stadtTrim = this.stadt.trim();
    let locationString = '';
    if (stadtTrim && this.land) {
      locationString = `${stadtTrim}, ${this.land}`;
    } else if (stadtTrim) {
      locationString = stadtTrim;
    } else if (this.land) {
      locationString = this.land;
    }
    formData.append('Location', locationString);

    if (this.categoryId) {
      formData.append('kategorien', JSON.stringify([this.categoryId]));
    }

    // Nur Werte mitschicken, die auch wirklich ausgefüllt wurden.
    // Leere Felder werden zu null statt zu einem leeren String "" zu werden,
    // was bei Zahlen-Spalten (ISO, Blende) sonst einen SQL-Fehler auslöst.
    const einstellungen: Record<string, string | number | null> = {
      Blende: this.aperture ? this.nurZahl(this.aperture) : null,
      Shutterspeed: this.shutter?.trim() || null,
      ISO: this.iso ? Number(this.nurZahl(this.iso)) : null,
      Objektiv: this.lens?.trim() || null,
    };
    formData.append('einstellungen', JSON.stringify(einstellungen));

    if (this.selectedFile) {
      formData.append('bild', this.selectedFile);
    }

    this.api.uploadPhoto(formData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigateByUrl('/profile');
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Upload-Fehler:', err);

        if (err.status === 0) {
          this.errorMessage = 'Server nicht erreichbar. Läuft das Backend?';
        } else if (err.status === 413) {
          this.errorMessage = 'Datei ist zu groß für den Server (maximal 15 MB).';
        } else if (err.status === 401) {
          this.errorMessage = 'Bitte melde dich erneut an.';
        } else {
          this.errorMessage = err.error?.error || 'Hochladen fehlgeschlagen. Versuch es erneut.';
        }
      },
    });
  }
}