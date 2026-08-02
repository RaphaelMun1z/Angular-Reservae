import { Component, computed, signal } from '@angular/core';
import { SiteFooter } from '../../components/site-footer/site-footer';
import { SiteNavbar } from '../../components/site-navbar/site-navbar';

@Component({
  selector: 'app-support',
  imports: [SiteNavbar, SiteFooter],
  templateUrl: './support.html',
  styleUrl: './support.scss',
})
export class Support {
  protected readonly search = signal('');
  protected readonly faqs = [
    { title: 'Como recebo meu ingresso?', text: 'Depois da confirmacao do pagamento, o ingresso fica disponivel em Meus ingressos e tambem e enviado para seu e-mail.', iconPath: 'M4 4h16v16H4zM8 8h8M8 12h8M8 16h5' },
    { title: 'Como acompanho meu pedido?', text: 'Acesse Meus pedidos para acompanhar o pagamento, o processamento e a confirmacao da sua compra.', iconPath: 'M6 3h12v18H6zM9 7h6M9 11h6M9 15h4' },
    { title: 'Posso transferir meu ingresso?', text: 'A transferencia de ingressos ainda nao esta disponivel. A funcionalidade sera liberada em uma proxima atualizacao.', iconPath: 'M17 3l4 4-4 4M21 7H9a4 4 0 0 0-4 4v2M7 21l-4-4 4-4M3 17h12a4 4 0 0 0 4-4v-2' },
    { title: 'O pagamento nao foi aprovado. O que fazer?', text: 'Confira os dados do pagamento, o limite disponivel e tente novamente. Se o problema continuar, fale com nosso suporte.', iconPath: 'M12 9v4M12 17h.01M10.3 3.8 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3l-7.5-13.2a2 2 0 0 0-3.4 0Z' },
  ] as const;
  protected readonly filteredFaqs = computed(() => {
    const term = this.search().trim().toLocaleLowerCase();
    return term ? this.faqs.filter((faq) => `${faq.title} ${faq.text}`.toLocaleLowerCase().includes(term)) : this.faqs;
  });

  protected updateSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }
}
