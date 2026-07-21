// Baut die korrekte Bild-URL, egal ob der gespeicherte Wert...
// - eine komplette Cloudinary-URL ist (neue Uploads: "https://res.cloudinary.com/...")
// - oder ein alter lokaler Pfad (Test-Fotos von vor der Cloudinary-Umstellung: "uploads/xyz.jpg")
const API_BASE = 'http://localhost:3000';

export function bildUrl(pfad: string | null | undefined): string {
  if (!pfad) return '';
  if (pfad.startsWith('http://') || pfad.startsWith('https://')) {
    return pfad;
  }
  return `${API_BASE}/${pfad}`;
}