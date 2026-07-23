import { Routes } from '@angular/router';
import { Home } from './Home/Home';
import { Login } from './Login/Login';
import { Register } from './Register/Register';
import { UploadPage } from './Upload/Upload';
import { Profile } from './Profile/Profile';
import { Explore } from './Explore/Explore';
import { ProfilEinrichten } from './ProfilEinrichten/ProfilEinrichten';
import { profileCompleteGuard } from './auth/profile-complete.guard';

export const routes: Routes = [
  { path: '', component: Home, canActivate: [profileCompleteGuard] },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'profil-einrichten', component: ProfilEinrichten },
  { path: 'upload', component: UploadPage, canActivate: [profileCompleteGuard] },
  { path: 'profile', component: Profile, canActivate: [profileCompleteGuard] },
  { path: 'profile/:id', component: Profile, canActivate: [profileCompleteGuard] },
  { path: 'explore', component: Explore, canActivate: [profileCompleteGuard] },
];