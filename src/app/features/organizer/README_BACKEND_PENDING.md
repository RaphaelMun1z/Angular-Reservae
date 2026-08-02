# Pendências Backend para Área Organizer - Reservae

## SeparaÃ§Ã£o de permissÃµes frontend

O perfil `ORGANIZER` possui no frontend apenas a Ã¡rea `/organizer/*` e a pÃ¡gina `/perfil`. Carrinho, checkout, criaÃ§Ã£o e acompanhamento de pedidos, ingressos pessoais, detalhes e transferÃªncia de ingressos, Club VIP e seleÃ§Ã£o de setor para compra sÃ£o recursos de `CUSTOMER`, com `ADMIN` mantido como exceÃ§Ã£o tÃ©cnica onde jÃ¡ era necessÃ¡rio.

As rotas de compra usam `roleGuard` com os roles permitidos. Quando um organizador tenta acessar uma rota de cliente, Ã© redirecionado para `/organizer/dashboard`. Nas pÃ¡ginas pÃºblicas de eventos, o organizador nÃ£o recebe CTA de compra e Ã© direcionado ao painel operacional.

Essa separaÃ§Ã£o visual e de navegaÃ§Ã£o Ã© uma proteÃ§Ã£o de experiÃªncia no frontend e nÃ£o substitui autorizaÃ§Ã£o server-side. O backend ainda deve validar ownership, permissÃµes e escopo dos recursos em todas as requisiÃ§Ãµes.

## 1. Contexto

A área Organizer usa somente endpoints reais já disponíveis no frontend. Onde os contratos atuais não garantem ownership ou não oferecem escrita específica para organizer, o frontend mostra estado vazio, erro amigável ou mensagem de pendência. Não há mocks de dados na aplicação.

## 2. O que o frontend usa hoje

| Recurso | Método e path | Uso | Limitação atual |
|---|---|---|---|
| Eventos | `GET /event-catalog-service/api/events/v1` | Lista e filtros locais em `OrganizerEvents` | Não garante que o evento pertence ao organizer |
| Evento | `GET /event-catalog-service/api/events/v1/{eventId}` | Detalhes do evento | Ownership deve ser validado no backend |
| Setores/inventário | `GET /event-catalog-service/api/events/v1/{eventId}` e inventário por evento/setor | Modo leitura | Não há escrita autorizada para organizer |
| Pedidos por evento | `GET /order-service/api/orders/v1/event/{eventId}/orders` | Vendas | O contrato de ownership ainda depende do backend |
| Ingressos por evento | `GET /ticket-service/api/tickets/v1/event/{eventId}` | Relatórios | A autorização por organizer precisa ser server-side |
| Validação de acesso | `POST /ticket-service/api/tickets/access/v1/validate` | Check-in | A operação é validada pelo ticket-service; não é simulada no frontend |
| Logs de acesso | `GET /ticket-service/api/tickets/access/v1/logs?eventId={eventId}` | Relatórios e auditoria | Filtros adicionais dependem do contrato efetivamente disponível |

## 3. Limitação principal atual

Ainda não existe uma garantia frontend/backend de “meus eventos”. A listagem atual exibe os eventos retornados pelo catálogo disponível e informa essa limitação. O frontend não afirma ownership nem substitui a autorização server-side.

## 4. Endpoints recomendados para futuro

### Eventos

- `GET /event-catalog-service/api/organizer/events`
- `POST /event-catalog-service/api/organizer/events`
- `GET /event-catalog-service/api/organizer/events/{eventId}`
- `PUT /event-catalog-service/api/organizer/events/{eventId}`
- `PATCH /event-catalog-service/api/organizer/events/{eventId}/publish`
- `PATCH /event-catalog-service/api/organizer/events/{eventId}/cancel`

### Setores

- `GET /event-catalog-service/api/organizer/events/{eventId}/sectors`
- `POST /event-catalog-service/api/organizer/events/{eventId}/sectors`
- `PUT /event-catalog-service/api/organizer/events/{eventId}/sectors/{sectorId}`
- `DELETE /event-catalog-service/api/organizer/events/{eventId}/sectors/{sectorId}`

### Operação e relatórios

- `GET /order-service/api/organizer/events/{eventId}/orders`
- `GET /order-service/api/organizer/events/{eventId}/sales-summary`
- `GET /ticket-service/api/organizer/events/{eventId}/tickets`
- `POST /ticket-service/api/organizer/events/{eventId}/access/validate`
- `GET /ticket-service/api/organizer/events/{eventId}/access/logs`
- `GET /ticket-service/api/organizer/events/{eventId}/check-in-summary`
- `GET /order-service/api/organizer/events/{eventId}/reports/sales`
- `GET /ticket-service/api/organizer/events/{eventId}/reports/check-ins`

Esses caminhos são recomendações e não são chamados pelo frontend atual.

## 5. Regras de autorização esperadas

- `ORGANIZER` acessa somente eventos próprios.
- `ADMIN` pode acessar todos, conforme política existente.
- `SUPPORT` acessa somente operações autorizadas.
- `CUSTOMER` não acessa a área Organizer.
- Validação de evento, venda, ingresso e check-in deve ser server-side.

## 6. Ownership sugerido

Para um MVP, o evento pode carregar `organizerId` derivado do `subject`/`userId` do JWT. Uma evolução possível é separar `Organization`, `OrganizationMember` e `EventOrganizer`.

## 7. Contratos sugeridos

Os contratos futuros podem incluir `OrganizerEventResponse`, `OrganizerEventSummary`, `OrganizerSalesSummary`, `OrganizerTicketSummary`, `OrganizerCheckinRequest`, `OrganizerCheckinResponse` e `OrganizerAccessLogResponse`. Nenhum DTO backend foi criado nesta etapa.

## 8. Impacto no frontend

Quando os contratos existirem, substituir os estados parciais em `organizer.store.ts` e os adapters de `features/organizer/data-access/`. As telas já diferenciam loading, vazio, erro e funcionalidade pendente.

## 9. Prioridade recomendada

1. Ownership e autorização de evento.
2. Endpoint de meus eventos.
3. Detalhes e setores do organizer.
4. Pedidos/vendas por evento.
5. Ingressos e check-in por evento.
6. Relatórios operacionais.
# SeparaÃ§Ã£o de permissÃµes frontend

O perfil `ORGANIZER` possui no frontend apenas a Ã¡rea `/organizer/*` e a pÃ¡gina `/perfil`. Carrinho, checkout, criaÃ§Ã£o e acompanhamento de pedidos, ingressos pessoais, detalhes e transferÃªncia de ingressos, Club VIP e seleÃ§Ã£o de setor para compra sÃ£o recursos de `CUSTOMER` (com `ADMIN` mantido como exceÃ§Ã£o tÃ©cnica onde jÃ¡ era necessÃ¡rio).

As rotas de compra usam `roleGuard` com os roles permitidos. Quando um organizador tenta acessar uma rota de cliente, Ã© redirecionado para `/organizer/dashboard`. Nas pÃ¡ginas pÃºblicas de eventos, o organizador nÃ£o recebe CTA de compra; Ã© direcionado ao painel operacional.

Essa separaÃ§Ã£o visual e de navegaÃ§Ã£o Ã© uma proteÃ§Ã£o de experiÃªncia no frontend e nÃ£o substitui autorizaÃ§Ã£o server-side. O backend ainda deve validar ownership, permissÃµes e escopo dos recursos em todas as requisiÃ§Ãµes.
