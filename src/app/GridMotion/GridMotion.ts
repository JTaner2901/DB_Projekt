import { Component, HostListener, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-grid-motion',
  imports: [CommonModule],
  templateUrl: './GridMotion.html',
  styleUrl: './GridMotion.css'
})
export class GridMotion implements OnInit {
  @Input() gradientColor: string = '#0093a5';

  rows: string[][] = [];
  rowOffsets: number[] = [];

  private readonly itemsPerRow = 9;
  private readonly rowCount = 6;
  private readonly maxMoveAmount = 160;

  // Easter Eggs - liegen unter public/easteregg/
  private readonly easterEggs = [
    '/easteregg/nadim.JPEG',
    '/easteregg/gayson.JPEG',
    '/easteregg/keks.JPEG',
    '/easteregg/bunusyezeyis.JPEG',
    '/easteregg/seni.JPEG',
    '/easteregg/Fyni.JPEG',
    '/easteregg/yunusamca.jpeg',
  ];

  ngOnInit(): void {
    this.rowOffsets = new Array(this.rowCount).fill(0);

    const totalTiles = this.itemsPerRow * this.rowCount;
    const pool = Array.from(
      { length: totalTiles },
      (_, i) => `https://picsum.photos/seed/grid-motion-${i}/300/300`
    );

    // Easter Eggs an zufälligen, aber festen Positionen im Pool einstreuen
    this.easterEggs.forEach((egg, i) => {
      const position = (i * 7 + 3) % totalTiles;
      pool[position] = egg;
    });

    for (let r = 0; r < this.rowCount; r++) {
      this.rows.push(pool.slice(r * this.itemsPerRow, (r + 1) * this.itemsPerRow));
    }
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    const ratio = event.clientX / window.innerWidth;

    this.rowOffsets = this.rowOffsets.map((_, index) => {
      const direction = index % 2 === 0 ? 1 : -1;
      return (ratio * this.maxMoveAmount - this.maxMoveAmount / 2) * direction;
    });
  }
}