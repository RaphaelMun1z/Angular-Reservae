import type { EventStatus, TicketType } from '../core/models/event-catalog.model';
import type { OrderStatus } from '../core/models/order.model';
import type { AccessValidationResultStatus } from '../core/models/ticket.model';

export function ticketTypeLabel(ticketType?: TicketType | string | null): string {
  switch (ticketType) {
    case 'FULL_TICKET_PRICE':
      return 'Inteira';
    case 'HALF_TICKET_PRICE':
      return 'Meia entrada';
    default:
      return ticketType || 'Tipo nao informado';
  }
}

export function ticketStatusLabel(status?: string | null): string {
  switch (status) {
    case 'VALID':
      return 'Válido';
    case 'USED':
      return 'Utilizado';
    case 'REVOKED':
      return 'Revogado';
    case 'EXPIRED':
      return 'Expirado';
    default:
      return status || 'Status nao informado';
  }
}

export function orderStatusLabel(status?: OrderStatus | string | null): string {
  switch (status) {
    case 'PENDING':
      return 'Pendente';
    case 'AWAITING_PAYMENT':
    case 'PAYMENT_PENDING':
      return 'Aguardando pagamento';
    case 'PAYMENT_APPROVED':
      return 'Pagamento aprovado';
    case 'APPROVED':
      return 'Aprovado';
    case 'PAID':
      return 'Pago';
    case 'PROCESSING':
      return 'Em processamento';
    case 'RESERVATION_FAILED':
      return 'Reserva nao concluida';
    case 'RESERVATION_REJECTED':
      return 'Reserva recusada';
    case 'CONFIRMED':
      return 'Confirmado';
    case 'PAYMENT_FAILED':
      return 'Pagamento recusado';
    case 'FAILED':
      return 'Falhou';
    case 'CANCELLED':
      return 'Cancelado';
    default:
      return status || 'Status nao informado';
  }
}

export function eventStatusLabel(status?: EventStatus | string | null): string {
  switch (status) {
    case 'SCHEDULED':
      return 'Agendado';
    case 'CANCELED':
      return 'Cancelado';
    case 'FINISHED':
      return 'Finalizado';
    default:
      return status || 'Evento';
  }
}

export function accessResultLabel(status?: AccessValidationResultStatus | string | null): string {
  switch (status) {
    case 'GRANTED':
      return 'Acesso liberado';
    case 'DENIED_USED':
      return 'Ingresso ja utilizado';
    case 'DENIED_REVOKED':
      return 'Ingresso revogado';
    case 'DENIED_INVALID':
      return 'Ingresso invalido';
    default:
      return 'Aguardando validacao';
  }
}
