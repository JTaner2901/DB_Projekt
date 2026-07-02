import { Component } from '@angular/core';
import { HeroSectionComponent } from "../hero-section/hero-section";
import { NgxFlickeringGridComponent } from '@omnedia/ngx-flickering-grid';
import { TopPhotos } from "../TopPhotos/TopPhotos";
import { UploadCTA } from "../UploadCTA/UploadCTA";
import { Discover } from "../Discover/Discover";
import { Gallery } from "../Gallery/Gallery";

@Component({
  selector: 'app-home',
  imports: [
    HeroSectionComponent,
    NgxFlickeringGridComponent,
    TopPhotos,
    UploadCTA,
    Discover,
    Gallery,
  ],
  templateUrl: './Home.html',
  styleUrl: './Home.css'
})
export class Home {
  onFilter(filter: any) {
    console.log(filter);
  }
}