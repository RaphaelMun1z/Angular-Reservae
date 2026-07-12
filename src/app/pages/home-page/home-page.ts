import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserMenu } from '../../components/user-menu/user-menu';
import { AuthStore } from '../../core/state/auth.store';
import { EventListItem, EventStore } from '../events/state/event.store';

const DEFAULT_EVENT_IMAGE =
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=1400';

interface PlatformNotice {
  readonly title: string;
  readonly description: string;
}

interface HomeFilter {
  readonly label: string;
  readonly queryParams: Record<string, string>;
}

interface CityDestination {
  readonly name: string;
  readonly description: string;
  readonly imageUrl: string;
  readonly queryParams: Record<string, string>;
}

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, UserMenu],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage implements OnInit {
  readonly eventStore = inject(EventStore);
  protected readonly authStore = inject(AuthStore);
  protected readonly newsletterMessage = signal<string | null>(null);
  protected readonly skeletonItems = [1, 2, 3, 4, 5, 6] as const;
  protected readonly featuredEvent = computed(() => this.eventStore.featuredEvents()[0] ?? null);
  protected readonly visibleEvents = computed(() => this.eventStore.featuredEvents().slice(0, 6));

  protected readonly platformNotices: readonly PlatformNotice[] = [
    {
      title: 'Ingressos digitais disponiveis',
      description: 'Receba seus ingressos com seguranca e acesse tudo pelo Reservae.',
    },
    {
      title: 'Compra segura',
      description: 'Acompanhe a confirmacao do pedido e os detalhes por e-mail.',
    },
    {
      title: 'Tudo em um so lugar',
      description: 'Consulte seus pedidos, ingressos e dados de perfil quando precisar.',
    },
  ];

  protected readonly homeFilters: readonly HomeFilter[] = [
    { label: 'Todos', queryParams: {} },
    { label: 'Proximos eventos', queryParams: { status: 'SCHEDULED' } },
    { label: 'Sao Paulo', queryParams: { state: 'SP' } },
    { label: 'Minas Gerais', queryParams: { state: 'MG' } },
    { label: 'Rio de Janeiro', queryParams: { state: 'RJ' } },
  ];

  protected readonly cityDestinations: readonly CityDestination[] = [
    {
      name: 'Sao Paulo',
      description: 'Grandes palcos, festivais e casas de show.',
      imageUrl: 'https://images.unsplash.com/photo-1543059080-f9b1272213d5?auto=format&fit=crop&q=80&w=900',
      queryParams: { state: 'SP' },
    },
    {
      name: 'Rio de Janeiro',
      description: 'Eventos ao vivo em uma das capitais mais vibrantes do pais.',
      imageUrl: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&q=80&w=900',
      queryParams: { state: 'RJ' },
    },
    {
      name: 'Belo Horizonte',
      description: 'Shows, festivais e experiencias em Minas Gerais.',
      imageUrl: 'https://images.unsplash.com/photo-1539020140153-e8c237112e53?auto=format&fit=crop&q=80&w=900',
      queryParams: { city: 'Belo Horizonte' },
    },
  ];

  ngOnInit(): void {
    this.eventStore.loadFeaturedEvents();
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
      return 'Horario em breve';
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

  protected retryEvents(): void {
    this.eventStore.loadFeaturedEvents();
  }

  protected submitNewsletter(event: Event): void {
    event.preventDefault();
    this.newsletterMessage.set('Cadastro de newsletter estara disponivel em breve.');
  }
}
