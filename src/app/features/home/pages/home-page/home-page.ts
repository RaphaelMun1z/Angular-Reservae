import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Router, RouterLink } from '@angular/router';
import { SiteFooter } from '../../../../layouts/site-footer/site-footer';
import { SiteNavbar } from '../../../../layouts/site-navbar/site-navbar';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { EventListItem, EventStore } from '../../../events/state/event.store';
import { eventStatusLabel } from '../../../../shared/presentation/presentation-labels';

const DEFAULT_EVENT_IMAGE = 'assets/showNatanzinhoLima.jpeg';

interface HomeFilter {
  readonly label: string;
  readonly queryParams: Record<string, string>;
}

interface BrazilianState {
  readonly code: string;
  readonly name: string;
}

interface HeroPhrase {
  readonly lead: string;
  readonly highlight: string;
}

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, SiteNavbar, SiteFooter, SkeletonLoader],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage implements OnInit, AfterViewInit, OnDestroy {
  readonly eventStore = inject(EventStore);
  private readonly router = inject(Router);
  protected readonly newsletterMessage = signal<string | null>(null);
  protected readonly heroPhrases: readonly HeroPhrase[] = [
    { lead: 'Viva seus', highlight: 'melhores momentos.' },
    { lead: 'Encontre seu', highlight: 'próximo show.' },
    { lead: 'Crie novas', highlight: 'memórias.' },
    { lead: 'Sinta a', highlight: 'energia ao vivo.' },
  ];
  protected readonly heroPhraseIndex = signal(0);
  protected readonly heroPhraseChanging = signal(false);
  private heroPhraseTimer?: ReturnType<typeof setInterval>;
  private heroPhraseTransitionTimer?: ReturnType<typeof setTimeout>;
  protected readonly visibleEvents = computed(() => this.eventStore.featuredEvents().slice(0, 6));
  protected readonly selectedState = signal('SP');
  protected readonly hoveredState = signal<string | null>(null);
  protected readonly stateBackgrounds: Readonly<Record<string, string>> = {
    AC: 'https://loremflickr.com/1600/900/rio%20branco,acre,brazil?lock=101',
    AL: 'https://loremflickr.com/1600/900/maceio,alagoas,brazil?lock=102',
    AP: 'https://loremflickr.com/1600/900/macapa,amapa,brazil?lock=103',
    AM: 'https://loremflickr.com/1600/900/amazonas,brazil?lock=104',
    BA: 'https://loremflickr.com/1600/900/salvador,bahia,brazil?lock=105',
    CE: 'https://loremflickr.com/1600/900/fortaleza,ceara,brazil?lock=106',
    DF: 'https://loremflickr.com/1600/900/brasilia,distrito%20federal,brazil?lock=107',
    ES: 'https://loremflickr.com/1600/900/vitoria,espirito%20santo,brazil?lock=108',
    GO: 'https://loremflickr.com/1600/900/goiania,goias,brazil?lock=109',
    MA: 'https://loremflickr.com/1600/900/sao%20luis,maranhao,brazil?lock=110',
    MT: 'https://loremflickr.com/1600/900/cuiaba,mato%20grosso,brazil?lock=111',
    MS: 'https://loremflickr.com/1600/900/campo%20grande,mato%20grosso%20do%20sul,brazil?lock=112',
    MG: 'assets/parquesabia.webp',
    PA: 'https://loremflickr.com/1600/900/belem,para,brazil?lock=114',
    PB: 'https://loremflickr.com/1600/900/joao%20pessoa,paraiba,brazil?lock=115',
    PR: 'https://loremflickr.com/1600/900/curitiba,parana,brazil?lock=116',
    PE: 'https://loremflickr.com/1600/900/recife,pernambuco,brazil?lock=117',
    PI: 'https://loremflickr.com/1600/900/teresina,piaui,brazil?lock=118',
    RJ: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&q=80&w=1200',
    RN: 'https://loremflickr.com/1600/900/natal,rio%20grande%20do%20norte,brazil?lock=120',
    RS: 'https://loremflickr.com/1600/900/porto%20alegre,rio%20grande%20do%20sul,brazil?lock=121',
    RO: 'https://loremflickr.com/1600/900/porto%20velho,rondonia,brazil?lock=122',
    RR: 'https://loremflickr.com/1600/900/boa%20vista,roraima,brazil?lock=123',
    SC: 'https://loremflickr.com/1600/900/florianopolis,santa%20catarina,brazil?lock=124',
    SP: 'https://images.unsplash.com/photo-1543059080-f9b1272213d5?auto=format&fit=crop&q=80&w=1200',
    SE: 'https://loremflickr.com/1600/900/aracaju,sergipe,brazil?lock=126',
    TO: 'https://loremflickr.com/1600/900/palmas,tocantins,brazil?lock=127',
  };
  protected readonly selectedStateBackground = computed(
    () => this.stateBackgrounds[this.hoveredState() ?? this.selectedState()] ?? DEFAULT_EVENT_IMAGE,
  );
  protected readonly brazilianStates: readonly BrazilianState[] = [
    { code: 'AC', name: 'Acre' }, { code: 'AL', name: 'Alagoas' }, { code: 'AP', name: 'Amapá' },
    { code: 'AM', name: 'Amazonas' }, { code: 'BA', name: 'Bahia' }, { code: 'CE', name: 'Ceará' },
    { code: 'DF', name: 'Distrito Federal' }, { code: 'ES', name: 'Espírito Santo' }, { code: 'GO', name: 'Goiás' },
    { code: 'MA', name: 'Maranhão' }, { code: 'MT', name: 'Mato Grosso' }, { code: 'MS', name: 'Mato Grosso do Sul' },
    { code: 'MG', name: 'Minas Gerais' }, { code: 'PA', name: 'Pará' }, { code: 'PB', name: 'Paraíba' },
    { code: 'PR', name: 'Paraná' }, { code: 'PE', name: 'Pernambuco' }, { code: 'PI', name: 'Piauí' },
    { code: 'RJ', name: 'Rio de Janeiro' }, { code: 'RN', name: 'Rio Grande do Norte' }, { code: 'RS', name: 'Rio Grande do Sul' },
    { code: 'RO', name: 'Rondônia' }, { code: 'RR', name: 'Roraima' }, { code: 'SC', name: 'Santa Catarina' },
    { code: 'SP', name: 'São Paulo' }, { code: 'SE', name: 'Sergipe' }, { code: 'TO', name: 'Tocantins' },
  ];
  protected readonly stateEvents = this.eventStore.events;
  @ViewChild('featuredCarousel') private featuredCarousel?: ElementRef<HTMLElement>;
  @ViewChild('stateCarousel') private stateCarousel?: ElementRef<HTMLElement>;
  protected readonly featuredIndex = signal(0);
  protected readonly stateEventIndex = signal(0);
  @ViewChild('homePageContent') private homePageContent?: ElementRef<HTMLElement>;
  private draggingFeatured = false;
  private dragStartX = 0;
  private dragStartScroll = 0;
  private draggingStateEvents = false;
  private stateDragStartX = 0;
  private stateDragStartScroll = 0;
  private revertScrollAnimations?: () => void;

  protected readonly homeFilters: readonly HomeFilter[] = [
    { label: 'Todos', queryParams: {} },
    { label: 'Próximos eventos', queryParams: { status: 'SCHEDULED' } },
    { label: 'São Paulo', queryParams: { state: 'SP' } },
    { label: 'Minas Gerais', queryParams: { state: 'MG' } },
    { label: 'Rio de Janeiro', queryParams: { state: 'RJ' } },
  ];

  ngOnInit(): void {
    this.eventStore.loadFeaturedEvents();
    this.selectState(this.selectedState());
    this.heroPhraseTimer = setInterval(() => this.changeHeroPhrase(), 4500);
  }

  ngAfterViewInit(): void {
    if (typeof window.matchMedia !== 'function') {
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || !this.homePageContent) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    const animationContext = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-scroll-reveal]').forEach((section) => {
        gsap.fromTo(
          section,
          { autoAlpha: 0, y: 42 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.75,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 84%',
              once: true,
            },
          },
        );
      });
    }, this.homePageContent.nativeElement);
    this.revertScrollAnimations = () => animationContext.revert();
  }

  ngOnDestroy(): void {
    this.revertScrollAnimations?.();
    if (this.heroPhraseTimer) {
      clearInterval(this.heroPhraseTimer);
    }
    if (this.heroPhraseTransitionTimer) {
      clearTimeout(this.heroPhraseTransitionTimer);
    }
  }

  private changeHeroPhrase(): void {
    this.heroPhraseChanging.set(false);
    this.heroPhraseIndex.update((index) => (index + 1) % this.heroPhrases.length);
    this.heroPhraseTransitionTimer = setTimeout(() => this.heroPhraseChanging.set(true), 30);
    setTimeout(() => this.heroPhraseChanging.set(false), 700);
  }

  protected selectState(state: string): void {
    this.selectedState.set(state);
    this.eventStore.updateFilters({ state, search: '', city: null });
  }

  protected setHoveredState(state: string): void {
    this.hoveredState.set(state);
  }

  protected clearHoveredState(): void {
    this.hoveredState.set(null);
  }

  protected selectedStateName(): string {
    return this.brazilianStates.find((state) => state.code === this.selectedState())?.name ?? this.selectedState();
  }

  protected eventImage(_event: EventListItem | null): string {
    return DEFAULT_EVENT_IMAGE;
  }

  protected formatDate(value: string | null | undefined): string {
    if (!value) {
      return 'Data em breve';
    }

    return new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value));
  }

  protected formatTime(value: string | null | undefined): string {
    if (!value) {
      return 'Horário em breve';
    }

    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }

  protected eventLocation(event: EventListItem): string {
    const cityState = [event.city, event.state].filter(Boolean).join('/');
    return [event.venueName, cityState].filter(Boolean).join(' - ') || 'Local a confirmar';
  }

  protected statusLabel(status: string | null | undefined): string {
    return eventStatusLabel(status);
  }

  protected openEvent(eventId: string, clickEvent: Event): void {
    clickEvent.preventDefault();
    clickEvent.stopPropagation();

    if (eventId) {
      void this.router.navigate(['/selecionar-setor', eventId]);
    }
  }

  protected retryEvents(): void {
    this.eventStore.loadFeaturedEvents();
  }

  protected startFeaturedDrag(event: PointerEvent): void {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    if ((event.target as HTMLElement | null)?.closest('a, button')) {
      return;
    }

    const carousel = this.featuredCarousel?.nativeElement;

    if (!carousel) {
      return;
    }

    this.draggingFeatured = true;
    this.dragStartX = event.clientX;
    this.dragStartScroll = carousel.scrollLeft;
    carousel.setPointerCapture?.(event.pointerId);
  }

  protected dragFeatured(event: PointerEvent): void {
    if (!this.draggingFeatured || !this.featuredCarousel?.nativeElement) {
      return;
    }

    event.preventDefault();
    this.featuredCarousel.nativeElement.scrollLeft =
      this.dragStartScroll - (event.clientX - this.dragStartX);
  }

  protected endFeaturedDrag(): void {
    this.draggingFeatured = false;
  }

  protected updateFeaturedIndex(): void {
    const carousel = this.featuredCarousel?.nativeElement;
    const cards = carousel?.querySelectorAll<HTMLElement>('.event-card');

    if (!carousel || !cards?.length) {
      return;
    }

    const closestIndex = Array.from(cards).reduce(
      (closest, card, index) => {
        const distance = Math.abs(card.offsetLeft - carousel.scrollLeft);
        return distance < closest.distance ? { index, distance } : closest;
      },
      { index: 0, distance: Number.POSITIVE_INFINITY },
    );

    this.featuredIndex.set(closestIndex.index);
  }

  protected scrollToFeatured(index: number): void {
    const carousel = this.featuredCarousel?.nativeElement;
    const card = carousel?.querySelectorAll<HTMLElement>('.event-card')[index];

    if (!carousel || !card) {
      return;
    }

    carousel.scrollTo({ left: card.offsetLeft, behavior: 'smooth' });
    this.featuredIndex.set(index);
  }

  protected startStateEventsDrag(event: PointerEvent): void {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if ((event.target as HTMLElement | null)?.closest('a, button')) return;
    const carousel = this.stateCarousel?.nativeElement;
    if (!carousel) return;
    this.draggingStateEvents = true;
    this.stateDragStartX = event.clientX;
    this.stateDragStartScroll = carousel.scrollLeft;
    carousel.setPointerCapture?.(event.pointerId);
  }

  protected dragStateEvents(event: PointerEvent): void {
    if (!this.draggingStateEvents || !this.stateCarousel?.nativeElement) return;
    event.preventDefault();
    this.stateCarousel.nativeElement.scrollLeft = this.stateDragStartScroll - (event.clientX - this.stateDragStartX);
  }

  protected endStateEventsDrag(): void {
    this.draggingStateEvents = false;
  }

  protected updateStateEventIndex(): void {
    const carousel = this.stateCarousel?.nativeElement;
    const cards = carousel?.querySelectorAll<HTMLElement>('.state-event-card');
    if (!carousel || !cards?.length) return;
    const closestIndex = Array.from(cards).reduce(
      (closest, card, index) => {
        const distance = Math.abs(card.offsetLeft - carousel.scrollLeft);
        return distance < closest.distance ? { distance, index } : closest;
      },
      { distance: Number.POSITIVE_INFINITY, index: 0 },
    );
    this.stateEventIndex.set(closestIndex.index);
  }

  protected scrollToStateEvent(index: number): void {
    const carousel = this.stateCarousel?.nativeElement;
    const card = carousel?.querySelectorAll<HTMLElement>('.state-event-card')[index];
    if (!carousel || !card) return;
    carousel.scrollTo({ left: card.offsetLeft, behavior: 'smooth' });
    this.stateEventIndex.set(index);
  }

  protected submitNewsletter(event: Event): void {
    event.preventDefault();
    this.newsletterMessage.set('Cadastro de newsletter estara disponivel em breve.');
  }
}
