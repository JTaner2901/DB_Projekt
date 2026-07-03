import { Routes } from '@angular/router';
import { Home } from './Home/Home';
import { Login } from './Login/Login';
import { Register } from './Register/Register';
import { UploadPage } from './Upload/Upload';
import { Profile } from './Profile/Profile';
import { Explore } from './Explore/Explore';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'upload', component: UploadPage },
  { path: 'profile', component: Profile },
  { path: 'explore', component: Explore },
];