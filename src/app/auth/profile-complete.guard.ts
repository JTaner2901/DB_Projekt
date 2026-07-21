import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from './Auth';

// Verhindert, dass eingeloggte Nutzer ohne Benutzername (= Profil-Setup
// noch nicht gemacht) auf normale Seiten kommen - schickt sie stattdessen
// zu /profil-einrichten. Nicht eingeloggte Nutzer sind davon nicht betroffen.
export const profileCompleteGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (auth.benoetigtProfilSetup()) {
    router.navigateByUrl('/profil-einrichten');
    return false;
  }

  return true;
};