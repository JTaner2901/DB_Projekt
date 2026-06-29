    import {
    Component,
    OnInit,
    OnDestroy,
    AfterViewInit,
    ElementRef,
    ViewChildren,
    QueryList,
    NgZone,
    Renderer2,
    } from '@angular/core';
    import { CommonModule } from '@angular/common';
    import { NgxFlickeringGridComponent } from '@omnedia/ngx-flickering-grid';
    import { NgxCrypticTextComponent } from '@omnedia/ngx-cryptic-text';

    export interface ParallaxImage {
    id: number;
    url: string;
    alt: string;
    posClass: string;
    /** Fixed stacking order. Higher = in front. */
    zIndex: number;
    }

    interface Spring {
    /** Current interpolated X/Y (px) */
    x: number;
    y: number;
    /** Target X/Y derived from mouse position */
    tx: number;
    ty: number;
    /** Cached movement strength in px — set once after view init */
    strength: number;
    }

    @Component({
    selector: 'app-hero-section',
    standalone: true,
    imports: [CommonModule, NgxFlickeringGridComponent, NgxCrypticTextComponent],
    templateUrl: './hero-section.html',
    styleUrls: ['./hero-section.css'],
    })
    export class HeroSectionComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChildren('imgWrapper') imgWrappers!: QueryList<ElementRef<HTMLElement>>;

    images: ParallaxImage[] = [
        { id: 1, url: 'assets/img/img1.webp',  alt: 'Aurora',         posClass: 'pi--top-left',        zIndex: 4 },
        { id: 2, url: 'assets/img/img2.webp',   alt: 'Snow scene',      posClass: 'pi--top-center',      zIndex: 6 },
        { id: 3, url: 'assets/img/img3.webp',    alt: 'Moon reflection', posClass: 'pi--top-right',       zIndex: 4 },
        { id: 4, url: 'assets/img/img4.webp', alt: 'Mountain sunset', posClass: 'pi--mid-left-top',    zIndex: 5 },
        { id: 5, url: 'assets/img/img5.webp',    alt: 'Silhouette',      posClass: 'pi--mid-left-bottom', zIndex: 6 },
        { id: 6, url: 'assets/img/img7.webp', alt: 'Tree tunnel',     posClass: 'pi--bottom-center',   zIndex: 5 },
        { id: 7, url: 'assets/img/img6.webp', alt: 'Forest tent',     posClass: 'pi--mid-right',       zIndex: 3 },
        { id: 8, url: 'assets/img/img8.webp',   alt: 'Cats',            posClass: 'pi--bottom-right',    zIndex: 5 },
    ];

    // ── Spring state per image ────────────────────────────────────────────────
    private springs: Spring[] = [];

    // Normalised mouse offset from viewport centre: range [-1, 1]
    private mouseNX = 0;
    private mouseNY = 0;

    private rafId: number | null = null;
    private listeners: (() => void)[] = [];

    /** Spring lerp factor — lower = more lag = softer feel */
    private readonly LERP = 0.065;

    /** Base multiplier: controls how far images travel at max cursor offset */
    private readonly BASE_STRENGTH = 38;

    constructor(private ngZone: NgZone, private renderer: Renderer2) {}

    ngOnInit(): void {}

    ngAfterViewInit(): void {
        // Initialise springs with zeroed state; strength gets cached after first frame
        this.imgWrappers.forEach(() => {
        this.springs.push({ x: 0, y: 0, tx: 0, ty: 0, strength: 0 });
        });

        this.ngZone.runOutsideAngular(() => {
        this.cacheStrengths();

        // ── Global mouse tracking (whole viewport) ──────────────
        const onMouseMove = (e: MouseEvent) => {
            this.mouseNX = (e.clientX / window.innerWidth  - 0.5) * 2;
            this.mouseNY = (e.clientY / window.innerHeight - 0.5) * 2;
        };

        // ── Smoothly return to origin when cursor leaves window ─
        const onMouseLeave = () => {
            this.mouseNX = 0;
            this.mouseNY = 0;
        };

        // ── Re-cache element sizes on resize ───────────────────
        const onResize = () => this.cacheStrengths();

        const rm1 = this.renderer.listen('document', 'mousemove',  onMouseMove);
        const rm2 = this.renderer.listen('document', 'mouseleave', onMouseLeave);
        const rm3 = this.renderer.listen('window',   'resize',     onResize);
        this.listeners.push(rm1, rm2, rm3);

        // ── Animation loop ──────────────────────────────────────
        const tick = () => {
            this.imgWrappers.forEach((wrapperRef, i) => {
            const s = this.springs[i];

            // Update target from current normalised mouse position
            s.tx = this.mouseNX * s.strength;
            s.ty = this.mouseNY * s.strength;

            // Lerp toward target (spring feel)
            s.x += (s.tx - s.x) * this.LERP;
            s.y += (s.ty - s.y) * this.LERP;

            // Only write to DOM when change is meaningful (perf guard)
            if (Math.abs(s.x - s.tx) > 0.01 || Math.abs(s.y - s.ty) > 0.01 ||
                Math.abs(s.x) > 0.01 || Math.abs(s.y) > 0.01) {
                this.renderer.setStyle(
                wrapperRef.nativeElement,
                'transform',
                `translate(${s.x.toFixed(2)}px, ${s.y.toFixed(2)}px)`
                );
            }
            });

            this.rafId = requestAnimationFrame(tick);
        };

        this.rafId = requestAnimationFrame(tick);
        });
    }

    ngOnDestroy(): void {
        if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId);
        }
        this.listeners.forEach(rm => rm());
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    /**
     * Derive movement strength from the rendered area of each image.
     * Larger images travel further — matches the weighted parallax feel.
     * Must be called after layout (ngAfterViewInit or resize).
     */
    private cacheStrengths(): void {
        // Falls die QueryList noch nicht befüllt ist, abbrechen statt crashen
        if (!this.imgWrappers || this.imgWrappers.length === 0) {
        return;
        }

        let maxArea = 0;

        // Erster Durchlauf: MaxArea ermitteln
        this.imgWrappers.forEach(ref => {
        // Sicherstellen, dass nativeElement existiert und die Funktion hat
        const el = ref?.nativeElement;
        if (el && typeof el.getBoundingClientRect === 'function') {
            const r = el.getBoundingClientRect();
            maxArea = Math.max(maxArea, r.width * r.height);
        }
        });

        // Zweiter Durchlauf: Strengths zuweisen
        this.imgWrappers.forEach((ref, i) => {
        const el = ref?.nativeElement;
        if (el && typeof el.getBoundingClientRect === 'function' && this.springs[i]) {
            const r = el.getBoundingClientRect();
            const area = r.width * r.height;
            const normalised = maxArea > 0 ? area / maxArea : 0.5;
            const remapped = 0.35 + normalised * 0.65;
            this.springs[i].strength = remapped * this.BASE_STRENGTH;
        }
        });
    }
    }