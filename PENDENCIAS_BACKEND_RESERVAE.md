# Pendências e Melhorias Backend - Reservae

## Contexto

Este relatório consolida pendências técnicas identificadas no backend do Reservae/MatchPass, com foco em contratos necessários para o frontend funcionar sem depender de estado em memória, dados temporários do carrinho ou rotas frágeis após redirecionamentos externos de pagamento.

A análise considerou os microserviços existentes no projeto:

- `api-gateway`
- `event-catalog-service`
- `inventory-service`
- `notification-service`
- `order-service`
- `payment-service`
- `ticket-service`
- `user-profile-service`

## Visão Geral das Prioridades

| Prioridade | Área | Pendência |
|---|---|---|
| Alta | Pedidos | Criar endpoints seguros baseados no usuário autenticado (`/me/orders`, `/me/orders/{orderId}`) |
| Alta | Pedidos | Enriquecer DTOs de pedido com dados suficientes para reconstruir telas após reload/redirect |
| Alta | Pagamento | Disponibilizar endpoint para continuar/recriar sessão de pagamento por `orderId` |
| Alta | Ingressos | Evitar expor entidade `Ticket` diretamente e criar contratos públicos estáveis |
| Alta | Segurança | Não confiar em `userId` enviado pelo frontend em fluxos sensíveis |
| Média | Erros | Padronizar payload de erro entre microserviços |
| Média | Notificações | Remover mocks de e-mail/evento e usar dados reais |
| Média | Eventos | Expor imagens, datas e metadados úteis ao frontend |
| Média | Inventário | Expor disponibilidade agregada de setores para tela de evento |
| Baixa | Observabilidade | Melhorar rastreabilidade entre order, reservation, payment e ticket |

## 1. Order Service

### Endpoints Existentes

Base atual:

```http
/order-service/api/orders
```

Endpoints identificados:

```http
POST /v1/checkout
GET /v1/{orderId}
GET /v1/event/{eventId}/orders
GET /v1/reservation/{reservationId}/order
PATCH /v1/{orderId}/status
GET /v1/user/{userId}/orders
```

O endpoint abaixo já existe e deve continuar sendo usado pelo frontend enquanto não houver uma rota autenticada por `/me`:

```http
GET /order-service/api/orders/v1/user/{userId}/orders
```

### Pendências Críticas

#### 1.1 Criar endpoints autenticados para pedidos do usuário atual

Hoje o frontend precisa conhecer e enviar o `userId` em rotas como:

```http
GET /order-service/api/orders/v1/user/{userId}/orders
```

Isso funciona, mas é frágil e abre espaço para enumeração de pedidos de outros usuários caso a autorização não valide o dono do recurso.

Recomendação:

```http
GET /order-service/api/orders/v1/me
GET /order-service/api/orders/v1/me/{orderId}
```

Esses endpoints devem obter o usuário via JWT:

```java
@AuthenticationPrincipal Jwt jwt
String userId = jwt.getSubject();
```

O padrão já existe no `user-profile-service`, que usa `/v1/me` com `@AuthenticationPrincipal Jwt`.

#### 1.2 Validar ownership em consultas por ID

O endpoint:

```http
GET /order-service/api/orders/v1/{orderId}
```

retorna o pedido por ID, mas a resposta inclui `userId` e não há garantia suficiente, no contrato público, de que apenas o dono ou um administrador acesse esse pedido.

Recomendação:

- Criar versão autenticada para o cliente:

```http
GET /order-service/api/orders/v1/me/{orderId}
```

- Manter o endpoint administrativo separado, com autorização explícita:

```http
GET /order-service/api/orders/v1/admin/{orderId}
```

#### 1.3 Remover `userId` do checkout enviado pelo frontend

O DTO atual de checkout possui:

```java
public record CheckoutRequestDTO(
    String userId,
    String eventId,
    List<OrderItemRequestDTO> items
) {}
```

O `userId` não deve ser fonte de verdade quando o usuário está autenticado.

Recomendação:

```java
public record CheckoutRequestDTO(
    String eventId,
    List<OrderItemRequestDTO> items
) {}
```

E no controller/service:

```java
String userId = jwt.getSubject();
```

#### 1.4 Enriquecer `OrderResponseDTO`

DTO atual:

```java
public record OrderResponseDTO(
    String orderId,
    String userId,
    BigDecimal totalAmount,
    OrderStatusEnum status,
    String paymentUrl,
    List<OrderItemResponseDTO> itens
) {}
```

Campos recomendados:

```java
public record OrderResponseDTO(
    String orderId,
    String userId,
    String eventId,
    String eventName,
    LocalDateTime eventDate,
    String venueName,
    String venueCity,
    String venueState,
    BigDecimal totalAmount,
    Integer totalItems,
    OrderStatusEnum status,
    String paymentUrl,
    String paymentSessionId,
    String reservationId,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    List<OrderItemResponseDTO> items
) {}
```

Benefício:

- A página `order-created` consegue ser reconstruída ao acessar diretamente:

```http
/order-created?orderId=...&sessionId=...
```

- A tela "Meus pedidos" consegue exibir dados úteis sem chamadas extras excessivas.

#### 1.5 Enriquecer `OrderSummaryResponseDTO`

DTO atual:

```java
public record OrderSummaryResponseDTO(
    String orderId,
    BigDecimal totalAmount,
    OrderStatusEnum status,
    String paymentUrl
) {}
```

Campos recomendados:

```java
public record OrderSummaryResponseDTO(
    String orderId,
    String eventId,
    String eventName,
    LocalDateTime eventDate,
    String venueName,
    BigDecimal totalAmount,
    Integer totalItems,
    OrderStatusEnum status,
    String paymentUrl,
    LocalDateTime createdAt
) {}
```

Sem esses campos, a página "Meus pedidos" fica dependente de chamadas adicionais ou precisa exibir uma lista pobre.

#### 1.6 Padronizar status de pedido

Enum atual:

```java
PENDING
AWAITING_PAYMENT
RESERVATION_FAILED
CONFIRMED
PAYMENT_FAILED
CANCELLED
```

Sugestão de expansão ou mapeamento claro:

```java
PENDING
PROCESSING
AWAITING_PAYMENT
PAYMENT_PENDING
PAYMENT_APPROVED
PAID
CONFIRMED
PAYMENT_FAILED
FAILED
RESERVATION_REJECTED
CANCELLED
EXPIRED
```

Caso o backend prefira manter menos status, documentar oficialmente o mapeamento para o frontend:

| Backend | Texto amigável |
|---|---|
| `PENDING` | Pendente |
| `AWAITING_PAYMENT` | Aguardando pagamento |
| `CONFIRMED` | Confirmado |
| `PAYMENT_FAILED` | Pagamento recusado |
| `RESERVATION_FAILED` | Reserva recusada |
| `CANCELLED` | Cancelado |

#### 1.7 Remover mocks usados em notificações

O `OrderService` ainda possui dados fixos para notificação:

- `CUSTOMER_NAME_MOCK`
- `CUSTOMER_EMAIL_MOCK`
- `EVENT_NAME_MOCK`
- `EVENT_DATE_MOCK`
- `ITEM_IMAGE_URL_MOCK`
- `FRONTEND_ORDER_URL`

Recomendação:

- Buscar dados reais do usuário no `user-profile-service`.
- Buscar dados reais do evento no `event-catalog-service`.
- Mover URL do frontend para configuração externa (`application.yml`, variável de ambiente ou config server).

## 2. Payment Service

### Endpoints Existentes

Base atual:

```http
/payment-service/api/payments
```

Endpoints identificados:

```http
POST /v1/checkout
POST /webhooks/v1/stripe
```

### Pendências

#### 2.1 Criar endpoint para continuar pagamento por pedido

Hoje o pagamento pode ser criado em fluxo assíncrono após reserva, e o `paymentUrl` é armazenado no pedido. Porém, se o link expirar, não existir ou precisar ser recriado, o frontend não possui um endpoint simples para continuar o pagamento por `orderId`.

Recomendação:

```http
POST /payment-service/api/payments/v1/orders/{orderId}/session
```

Resposta sugerida:

```json
{
  "orderId": "uuid",
  "paymentId": "uuid",
  "paymentUrl": "https://checkout.stripe.com/...",
  "sessionId": "cs_test_...",
  "expiresAt": "2026-07-15T20:30:00"
}
```

Regras:

- Permitir apenas pedidos `AWAITING_PAYMENT` ou `PAYMENT_PENDING`.
- Negar pedidos confirmados, cancelados ou recusados.
- Validar que o usuário autenticado é dono do pedido.

#### 2.2 Persistir e expor `sessionId`

O retorno externo do Stripe pode incluir:

```http
?orderId=...&sessionId=cs_test_...
```

O backend deveria armazenar o `sessionId` relacionado ao pagamento para permitir validações e troubleshooting.

Recomendação:

- Persistir `stripeSessionId`.
- Retornar `paymentSessionId` em DTOs administrativos ou em DTOs do dono do pedido.
- Usar `sessionId` apenas como informação auxiliar; a fonte de verdade deve ser o webhook/processamento do pagamento.

#### 2.3 Garantir idempotência de webhooks

O serviço possui tratamento de eventos processados, o que é positivo. A melhoria recomendada é garantir que todas as transições geradas por webhook sejam idempotentes também no `order-service` e no `ticket-service`.

Exemplo:

- Webhook duplicado de pagamento aprovado não deve gerar ingressos duplicados.
- Evento Kafka duplicado não deve confirmar ou emitir recursos duas vezes.

## 3. Ticket Service

### Endpoints Existentes

Base atual:

```http
/ticket-service/api/tickets
```

Endpoints identificados:

```http
GET /v1/{id}
GET /v1/user/{userId}
GET /v1/event/{eventId}
PATCH /v1/{id}/revoke
POST /access/v1/validate
GET /access/v1/logs
```

### Pendências

#### 3.1 Não retornar entidade `Ticket` diretamente

O controller retorna `Ticket` nos endpoints públicos:

```java
ResponseEntity<Ticket>
ResponseEntity<List<Ticket>>
ResponseEntity<Page<Ticket>>
```

Apesar de existirem DTOs como `TicketResponseDTO` e `TicketSummaryResponseDTO`, eles não estão sendo usados no controller.

Recomendação:

```http
GET /ticket-service/api/tickets/v1/me
GET /ticket-service/api/tickets/v1/me/{ticketId}
```

Com DTO público:

```java
public record TicketResponseDTO(
    String ticketId,
    String orderId,
    String eventId,
    String eventName,
    LocalDateTime eventDate,
    String venueName,
    String sectorId,
    String sectorName,
    String ticketType,
    TicketStatusEnum status,
    String qrCode,
    LocalDateTime createdAt,
    LocalDateTime usedAt
) {}
```

#### 3.2 Validar ownership em ingressos por usuário

Endpoint atual:

```http
GET /ticket-service/api/tickets/v1/user/{userId}
```

Recomendação:

- Criar `/v1/me`.
- Validar JWT.
- Manter `/v1/user/{userId}` apenas para admin, com `@PreAuthorize`.

#### 3.3 Criar endpoint por pedido

Para a página de sucesso da compra e para "Ver meus ingressos", seria útil:

```http
GET /ticket-service/api/tickets/v1/orders/{orderId}
```

Ou, de forma mais segura:

```http
GET /ticket-service/api/tickets/v1/me/orders/{orderId}
```

Isso evita o frontend ter que buscar todos os ingressos do usuário e filtrar localmente.

#### 3.4 Garantir emissão idempotente

Quando o pagamento for confirmado, a geração de ingressos deve ser idempotente por:

- `orderId`
- `reservationId`
- item/setor

Deve existir restrição ou verificação para impedir emissão duplicada caso o mesmo evento Kafka seja consumido mais de uma vez.

## 4. Event Catalog Service

### Endpoints Existentes

Base atual:

```http
/event-catalog-service/api/events
```

Endpoints identificados:

```http
GET /v1
GET /v1/{id}
POST /v1
POST /v1/{id}/add-sector
POST /v1/{eventId}/sectors/prices
```

Endpoints de validação identificados:

```http
GET /event-catalog-service/api/events/validate/v1/{eventId}/exists
GET /event-catalog-service/api/events/validate/v1/{eventId}/sector/{sectorId}/exists
GET /event-catalog-service/api/events/validate/v1/{eventId}/sector/{sectorId}/validate-capacity/{ticketsAmount}
```

DTOs atuais relevantes:

```java
public record EventSummaryResponseDTO(
    String eventId,
    String title,
    LocalDateTime eventDate,
    EventStatusEnum status,
    String venueName,
    String venueCity,
    String venueState
) {}
```

```java
public record EventDetailsResponseDTO(
    String eventId,
    String title,
    LocalDateTime eventDate,
    EventStatusEnum status,
    String venueName,
    String venueCity,
    String venueState,
    List<EventSectorDetailsDTO> sectorsDetails
) {}
```

```java
public record SectorPricingResponseDTO(
    String sectorId,
    String sectorName,
    BigDecimal basePrice,
    BigDecimal halfPrice
) {}
```

### Pendências

#### 4.1 Expor imagens e descrição do evento

Para o frontend, faltam campos como:

```java
String description
String imageUrl
String bannerUrl
String category
```

Sem esses campos, páginas de listagem e detalhe tendem a depender de mocks ou imagens locais.

#### 4.2 Expor metadados do local

Campos úteis:

```java
String venueId
String venueAddress
String venueNumber
String venueNeighborhood
String venueZipCode
```

#### 4.3 Expor disponibilidade por setor

A tela de detalhe do evento normalmente precisa mostrar setores, preços e disponibilidade numa única resposta.

Sugestão para `EventSectorDetailsDTO`:

```java
String sectorId
String sectorName
BigDecimal basePrice
BigDecimal halfPrice
Integer capacity
Integer available
Integer reserved
Integer sold
```

Caso a disponibilidade permaneça no `inventory-service`, criar um endpoint agregador no backend ou no gateway para evitar múltiplas chamadas por setor.

## 5. Inventory Service

### Endpoints Existentes

Base atual:

```http
/inventory-service/api/inventory
```

Foram identificados endpoints para:

- Criar inventário de setor por evento.
- Consultar inventário por evento/setor.
- Reservar ingressos.
- Consultar status de reserva.
- Confirmar/liberar reserva.
- Confirmar/liberar reservas por pedido.
- Buscar reservas por usuário.
- Buscar reservas por pedido.
- Buscar reserva por ID.

Status identificados:

```java
RESERVED
CONFIRMED
CANCELLED
EXPIRED
```

### Pendências

#### 5.1 Expor disponibilidade agregada por evento

Recomendação:

```http
GET /inventory-service/api/inventory/v1/events/{eventId}/availability
```

Resposta sugerida:

```json
{
  "eventId": "uuid",
  "sectors": [
    {
      "sectorId": "uuid",
      "capacity": 100,
      "available": 72,
      "reserved": 8,
      "sold": 20
    }
  ]
}
```

#### 5.2 Criar rotas autenticadas para reservas do usuário atual

Se existir endpoint por `userId`, o ideal é adicionar:

```http
GET /inventory-service/api/inventory/v1/me/reservations
```

Assim o frontend não precisa enviar `userId` manualmente.

#### 5.3 Documentar tempo de expiração de reserva

O frontend precisa saber quando deve informar que uma reserva expirou ou quando deve sugerir tentar novamente.

Sugestão:

```java
LocalDateTime reservedAt
LocalDateTime expiresAt
```

## 6. User Profile Service

### Pontos Positivos

O `user-profile-service` já segue um padrão bom para endpoints do usuário atual:

```http
GET /v1/me
PATCH /v1/me
```

E usa:

```java
@AuthenticationPrincipal Jwt jwt
```

Esse padrão deve ser replicado nos serviços de pedidos, ingressos e reservas.

### Pendências

#### 6.1 Expor contrato usado pelos demais serviços

O `order-service` precisa de dados reais para notificação e resumo da compra:

- nome completo
- e-mail
- documento, se necessário

Recomendação:

```http
GET /user-profile-service/api/profiles/v1/internal/{userId}
```

Esse endpoint deve ser protegido para chamadas internas entre serviços, ou substituído por evento/cache local conforme a arquitetura desejada.

## 7. Notification Service

### Pendências

#### 7.1 Receber dados reais do pedido

O envio de notificação deve receber dados completos:

```java
String customerName
String customerEmail
String eventName
String eventDate
String orderUrl
List<NotificationItemDTO> items
```

Hoje parte desses dados é montada com mocks no `order-service`.

#### 7.2 Registrar status de envio

Recomendação:

- Persistir tentativas de envio.
- Registrar falhas.
- Permitir reprocessamento.
- Correlacionar notificação com `orderId`, `paymentId` e `userId`.

#### 7.3 Externalizar templates

Templates de e-mail devem ser versionáveis e fáceis de alterar sem mexer na regra de negócio.

## 8. Segurança e Autorização

### Pendências Gerais

#### 8.1 Substituir rotas públicas baseadas em `userId`

Rotas como:

```http
GET /order-service/api/orders/v1/user/{userId}/orders
GET /ticket-service/api/tickets/v1/user/{userId}
```

devem ser complementadas por:

```http
GET /order-service/api/orders/v1/me
GET /ticket-service/api/tickets/v1/me
```

Rotas com `{userId}` devem ficar restritas a administradores ou comunicação interna.

#### 8.2 Aplicar `@PreAuthorize` nos controllers sensíveis

Sugestão:

```java
@PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
```

Para consultas do próprio usuário.

```java
@PreAuthorize("hasRole('ADMIN')")
```

Para consultas por `userId`, por evento ou operações de revogação.

#### 8.3 Validar dono do recurso no service

Mesmo com `@PreAuthorize`, o service deve validar:

- pedido pertence ao usuário autenticado
- ingresso pertence ao usuário autenticado
- reserva pertence ao usuário autenticado

Isso evita vazamento quando IDs são conhecidos.

## 9. Padronização de Erros

### Situação Atual

Há handlers globais, mas os formatos variam. No `order-service`, por exemplo, alguns erros retornam:

```json
{
  "localDateTime": "...",
  "message": ["..."],
  "details": "uri=/..."
}
```

Outros retornam:

```json
{
  "timestamp": "...",
  "status": 409,
  "error": "Conflict",
  "message": "..."
}
```

### Recomendação

Padronizar todos os microserviços para:

```json
{
  "timestamp": "2026-07-15T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Mensagem amigável",
  "path": "/order-service/api/orders/v1/checkout",
  "traceId": "opcional"
}
```

Para validações de campo:

```json
{
  "timestamp": "2026-07-15T10:30:00Z",
  "status": 400,
  "error": "Validation Error",
  "message": "Dados inválidos",
  "path": "/...",
  "fields": {
    "eventId": "Evento é obrigatório",
    "items": "Informe ao menos um item"
  }
}
```

Benefícios:

- Frontend trata erros de forma previsível.
- Logs ficam mais correlacionáveis.
- Mensagens amigáveis podem ser exibidas sem parsing frágil.

## 10. Contratos Recomendados Para o Frontend

### 10.1 Pedidos do usuário

```http
GET /order-service/api/orders/v1/me
```

Resposta:

```json
[
  {
    "orderId": "uuid",
    "eventId": "uuid",
    "eventName": "Show Reservae",
    "eventDate": "2026-09-01T20:00:00",
    "venueName": "Arena Reservae",
    "totalAmount": 250.00,
    "totalItems": 2,
    "status": "AWAITING_PAYMENT",
    "paymentUrl": "https://checkout.stripe.com/...",
    "createdAt": "2026-07-15T12:00:00"
  }
]
```

### 10.2 Pedido por ID do usuário autenticado

```http
GET /order-service/api/orders/v1/me/{orderId}
```

Uso:

- Página `order-created`.
- Reload direto após retorno do Stripe.
- Detalhe de pedido.

### 10.3 Continuar pagamento

```http
POST /payment-service/api/payments/v1/orders/{orderId}/session
```

Uso:

- Botão "Continuar pagamento".
- Recriar sessão se a URL anterior expirou.

### 10.4 Ingressos do usuário

```http
GET /ticket-service/api/tickets/v1/me
```

### 10.5 Ingressos por pedido

```http
GET /ticket-service/api/tickets/v1/me/orders/{orderId}
```

Uso:

- Botão "Ver meus ingressos" após pagamento aprovado.

## 11. Checklist de Implementação Sugerida

### Fase 1 - Correções de Integração

- [ ] Enriquecer `OrderSummaryResponseDTO`.
- [ ] Enriquecer `OrderResponseDTO`.
- [ ] Garantir que `GET /orders/v1/{orderId}` retorne dados suficientes para `order-created`.
- [ ] Criar endpoint para continuar pagamento por `orderId`.
- [ ] Usar DTOs públicos no `ticket-service` em vez de retornar entidade.

### Fase 2 - Segurança

- [ ] Criar `/orders/v1/me`.
- [ ] Criar `/orders/v1/me/{orderId}`.
- [ ] Criar `/tickets/v1/me`.
- [ ] Criar `/tickets/v1/me/orders/{orderId}`.
- [ ] Remover dependência de `userId` enviado pelo frontend no checkout.
- [ ] Restringir endpoints por `{userId}` a admin ou uso interno.

### Fase 3 - Experiência do Frontend

- [ ] Expor nome, data, local e imagem do evento em pedidos.
- [ ] Expor disponibilidade por setor.
- [ ] Expor `createdAt`, `updatedAt`, `expiresAt` e `paymentSessionId` quando aplicável.
- [ ] Documentar status oficiais e textos amigáveis.

### Fase 4 - Robustez Operacional

- [ ] Padronizar payload de erro.
- [ ] Garantir idempotência em confirmação de pagamento e geração de ingressos.
- [ ] Registrar tentativas de notificação.
- [ ] Adicionar `traceId`/correlation ID entre serviços.

## 12. Ordem Recomendada de Ataque

1. **Pedidos por usuário e por ID com DTOs ricos**: desbloqueia `order-created` e "Meus pedidos".
2. **Pagamento por `orderId`**: resolve o fluxo de "Continuar pagamento".
3. **Ingressos por usuário/pedido com DTOs públicos**: resolve "Ver meus ingressos".
4. **Endpoints `/me` com JWT**: fecha a principal lacuna de segurança.
5. **Padronização de erros e status**: reduz complexidade no frontend.
6. **Remoção dos mocks de notificação**: melhora qualidade de comunicação com o usuário.

## Conclusão

O backend já possui boa parte dos fluxos principais: criação de pedido, reserva de inventário, pagamento via Stripe, webhook, confirmação e geração de ingressos. As principais pendências não são de existência do fluxo, mas de contrato, segurança e completude dos DTOs.

Para o frontend ser autossuficiente após reloads e redirecionamentos externos, o ponto mais importante é transformar o `order-service` na fonte confiável da compra, retornando todos os dados necessários por `orderId` e por usuário autenticado. Em seguida, o `payment-service` deve permitir continuar o pagamento por pedido, e o `ticket-service` deve expor ingressos por usuário/pedido usando DTOs estáveis.
