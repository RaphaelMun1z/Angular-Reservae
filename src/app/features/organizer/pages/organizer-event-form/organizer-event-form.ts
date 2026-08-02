import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({ selector: 'app-organizer-event-form', imports: [FormsModule, RouterLink], template: `
  <main class="organizer-page"><header class="page-header"><div><span class="eyebrow">Organizer</span><h1>{{ editing ? 'Editar evento' : 'Criar evento' }}</h1><p class="muted">Valide os dados localmente e prepare o cadastro.</p></div><a class="button secondary" routerLink="/organizer/management/events">Voltar</a></header><p class="notice">Criação e edição de eventos para organizadores ainda dependem da integração com backend. Nenhum dado será enviado.</p><form class="card field-grid" (ngSubmit)="submit()"><label>Título<input name="title" [(ngModel)]="form.title" required /></label><label>Categoria<input name="category" [(ngModel)]="form.category" /></label><label>Data<input name="date" type="date" [(ngModel)]="form.date" required /></label><label>Horário<input name="time" type="time" [(ngModel)]="form.time" /></label><label>Local<input name="venue" [(ngModel)]="form.venue" /></label><label>Cidade e estado<input name="city" [(ngModel)]="form.city" /></label><label class="full">Descrição<textarea name="description" rows="4" [(ngModel)]="form.description"></textarea></label><label>Status<select name="status" [(ngModel)]="form.status"><option>Rascunho</option><option>Publicado</option></select></label><label>Banner<input name="banner" type="text" [(ngModel)]="form.banner" placeholder="URL opcional (apenas visual)" /></label><label class="full">Observações<textarea name="notes" rows="3" [(ngModel)]="form.notes"></textarea></label><div class="actions full"><button class="primary" type="submit">Validar formulário</button></div></form>@if (message()) {<p class="notice">{{ message() }}</p>}</main>
`, styleUrl: '../../organizer.scss', standalone: true })
export class OrganizerEventForm {
  private readonly route = inject(ActivatedRoute);
  protected readonly editing = this.route.snapshot.paramMap.has('eventId') || this.route.parent?.snapshot.paramMap.has('eventId') === true;
  protected readonly message = signal<string | null>(null);
  protected form = { title: '', category: '', date: '', time: '', venue: '', city: '', description: '', status: 'Rascunho', banner: '', notes: '' };
  protected submit(): void { this.message.set('Formulário validado localmente. Nenhuma alteração foi persistida. A criação e edição dependem de ownership e autorização no backend.'); }
}
