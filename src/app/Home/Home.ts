import { Component } from '@angular/core';
import { HeroSectionComponent } from "../hero-section/hero-section";
import { NgxFlickeringGridComponent } from '@omnedia/ngx-flickering-grid';
import { FilterBarComponent } from "../filter-leiste/Filterbar";
import { TopPhotos } from "../TopPhotos/TopPhotos";
import { UploadCTA } from "../UploadCTA/UploadCTA";

@Component({
  selector: 'app-home',
  imports: [HeroSectionComponent, NgxFlickeringGridComponent, FilterBarComponent, TopPhotos, UploadCTA],
  templateUrl: './Home.html',
  styleUrl: './Home.css'
})
export class Home {
  onFilter(filter: any) {
    console.log(filter);
  }
}