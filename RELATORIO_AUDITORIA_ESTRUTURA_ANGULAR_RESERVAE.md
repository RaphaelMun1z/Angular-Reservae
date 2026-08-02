# Auditoria de Estrutura Angular - Reservae

## 1. Resumo geral

O frontend está funcional e apresenta uma base adequada para MVP: Angular 21 standalone, lazy loading, guards, interceptor, stores locais, componentes reutilizáveis e validações automatizadas funcionando. Porém, a organização ainda é centrada em `pages/` e não em vertical slices por domínio.

O principal ponto de atenção arquitetural é a direção de dependência: APIs em `core/services` e um serviço em `shared` importam contratos e tipos de stores localizados em `pages`. Isso acopla camadas transversais às páginas e dificulta uma futura migração para `features/`.

Nenhum arquivo foi movido ou removido nesta auditoria. A recomendação é migrar incrementalmente após estabilizar a release candidate, começando por separar contratos/data-access de UI.

## 2. Referência usada

A análise usou os princípios conceituais fornecidos no briefing:

- `core/`: fundamentos transversais, como autenticação, configuração, HTTP, autorização e observabilidade;
- `shared/`: UI genérica, pipes e directives sem regra de negócio;
- `features/`: slices verticais de produto, agrupando páginas, componentes, data-access, state e rotas por domínio;
- `app.routes.ts`: composição de alto nível e lazy loading;
- dependências preferenciais: `features -> core`, `features -> shared`, `shared` sem regra de domínio e `core` sem importar features.

## 3. Estrutura atual encontrada

```text
src/app/
├── app.config.ts
├── app.html
├── app.routes.ts
├── app.scss
├── app.ts
├── assets/
├── components/
│   ├── admin-shell/
│   ├── empty-state/
│   ├── site-footer/
│   ├── site-navbar/
│   ├── skeleton-loader/
│   ├── status-badge/
│   └── user-menu/
├── core/
│   ├── auth/
│   ├── models/
│   ├── services/
│   └── state/
├── pages/
│   ├── checkout/state/
│   ├── events/state/
│   ├── gate-scanner/state/
│   ├── my-orders/state/
│   ├── my-tickets/state/
│   ├── páginas de erro/
│   └── demais páginas standalone/
└── shared/
    ├── event-display-data.service.ts
    └── presentation-labels.ts
```

Não foram encontrados `features/`, `layouts/`, pipes ou directives próprias. As pastas genéricas vazias e o model órfão identificados na auditoria anterior já foram removidos.

## 4. Pontos alinhados com boas práticas

| Ponto | Evidência no projeto | Benefício |
|---|---|---|
| Angular standalone | Componentes e páginas usam `imports` diretamente | Menos módulos agregadores e lazy loading simples |
| Core para autenticação | `core/auth`, `core/state/auth.store.ts` e `auth.providers.ts` | Centraliza sessão, Keycloak, interceptor e guards |
| Guards separados | `auth.guard.ts` e `role.guard.ts` | Autorização explícita e reutilizável |
| Interceptor transversal | `core/auth/auth.interceptor.ts` | Token e tratamento de sessão em um ponto central |
| Lazy loading | `app.routes.ts` usa `loadComponent` na maioria das páginas | Reduz o carregamento de páginas secundárias |
| Stores locais | `checkout/state`, `events/state`, `gate-scanner/state`, `my-orders/state`, `my-tickets/state` | Estado próximo dos fluxos que o utilizam |
| UI reutilizável inicial | `StatusBadgeComponent`, `EmptyStateComponent`, `SkeletonLoader` | Reduz duplicação visual sem mover regra de negócio complexa |
| Rotas agrupadas por responsabilidade | `publicRoutes`, `authenticatedRoutes`, `adminRoutes` e `specialRoutes` | Melhora a legibilidade sem alterar URLs |
| Validação automatizada | Build, lint e testes aprovados na etapa atual | Reduz risco de refatorações incrementais |

## 5. Desalinhamentos encontrados

| Problema | Caminho/arquivo | Impacto | Severidade |
|---|---|---|---|
| Páginas de domínio concentradas em pasta global | `src/app/pages/*` | Dificulta ownership e evolução por feature | Média |
| APIs de domínio dentro de `core/services` | `http-event.api.ts`, `http-checkout.api.ts`, `http-ticket.api.ts`, `http-scanner.api.ts` | `core` conhece contratos definidos em páginas | Alta |
| Stores e contratos misturados em `pages/*/state` | `checkout.store.ts`, `event.store.ts`, `ticket.store.ts`, `scanner.store.ts` | UI, state e contratos não formam slices independentes | Média |
| Serviço de domínio em `shared` | `shared/event-display-data.service.ts` | `shared` contém cache, chamadas e regra de composição de eventos | Alta |
| Componente reutilizável dependente de feature | `components/site-navbar/site-navbar.ts` importa `CheckoutStore` de `pages/checkout` | Navbar fica acoplada ao checkout | Média |
| Modelos todos concentrados em `core/models` | `event-catalog.model.ts`, `inventory.model.ts`, `order.model.ts`, `ticket.model.ts` | Contratos específicos parecem globais | Média |
| Rotas ainda centralizadas em um arquivo | `app.routes.ts` | Arquivo cresce conforme novas features surgem | Média |
| Layouts não formalizados | `App` tem apenas `router-outlet`; páginas importam seus próprios shells | Difícil garantir layout por grupo sem migração visual | Baixa/Média |
| `components/` não está semanticamente separado de shared | `src/app/components/*` | Não distingue UI genérica de shell/layout específico | Baixa |
| `presentation-labels.ts` depende de modelos de domínio | `src/app/shared/presentation-labels.ts` | Shared conhece tipos de negócio; aceitável no curto prazo, mas não ideal | Baixa/Média |

Não foram encontrados barrels `index.ts`, módulos legados ou pastas vazias na estrutura atual auditada.

## 6. Dependências e imports problemáticos

| Origem | Import | Problema | Sugestão |
|---|---|---|---|
| `core/services/http-event.api.ts` | `../../pages/events/state/event.store` | Core importa `EventApi`, filtros e tipos de uma página | Mover o contrato para `features/events/data-access` ou `core/http/contracts` temporariamente |
| `core/services/http-checkout.api.ts` | `../../pages/checkout/state/checkout.store` | API transversal depende do store da página | Separar `CheckoutApi`/`CheckoutOrder` em contrato de feature |
| `core/services/http-ticket.api.ts` | `../../pages/my-tickets/state/ticket.store` | Core depende do state de ingressos | Mover contrato para `features/tickets/data-access` |
| `core/services/http-scanner.api.ts` | `../../pages/gate-scanner/state/scanner.store` | API depende do store operacional | Mover `ScannerApi` para `features/admin/scanner/data-access` |
| `shared/event-display-data.service.ts` | `../pages/events/state/event.store` | Shared importa API e tipos de domínio | Mover o serviço para `features/events/facade` ou `data-access` |
| `components/site-navbar/site-navbar.ts` | `../../pages/checkout/state/checkout.store` | Componente visual genérico lê estado específico do checkout | Introduzir um contrato de header/carrinho ou mover navbar para `layouts/main-layout` |
| `shared/presentation-labels.ts` | `../core/models/*.model` | Labels de domínio em shared | Manter no curto prazo; separar labels por feature durante a migração |
| `app.config.ts` | tokens exportados de stores em `pages` | Configuração raiz conhece contratos de features | Mover tokens para contratos independentes antes de extrair rotas por feature |

Não foram encontradas violações de `core` importando `features/`, porque a pasta `features/` ainda não existe. Também não foram encontrados stores dependendo de componentes ou data-access dependendo de UI.

## 7. Estrutura recomendada para o Reservae

```text
src/app/
├── app.config.ts
├── app.routes.ts
├── core/
│   ├── auth/
│   ├── config/
│   ├── http/
│   │   ├── api-url.service.ts
│   │   └── contracts/
│   ├── access/
│   │   └── guards/
│   ├── models/
│   └── state/
├── shared/
│   ├── components/
│   │   ├── empty-state/
│   │   ├── skeleton-loader/
│   │   └── status-badge/
│   ├── directives/
│   └── pipes/
├── layouts/
│   ├── main-layout/        # somente quando navbar/footer forem centralizados
│   └── admin-shell/        # somente se o shell puder ser compartilhado sem regressão
└── features/
    ├── home/
    │   └── pages/
    ├── events/
    │   ├── pages/
    │   ├── data-access/
    │   ├── state/
    │   ├── facade/
    │   └── events.routes.ts
    ├── checkout/
    │   ├── pages/
    │   ├── data-access/
    │   ├── state/
    │   └── checkout.routes.ts
    ├── orders/
    │   ├── pages/
    │   ├── data-access/
    │   ├── state/
    │   └── orders.routes.ts
    ├── tickets/
    │   ├── pages/
    │   ├── data-access/
    │   ├── state/
    │   └── tickets.routes.ts
    ├── profile/
    ├── admin/
    │   ├── dashboard/
    │   ├── scanner/
    │   └── settings/
    ├── support/
    ├── review/
    └── errors/
```

Features pequenas, como `club-vip`, podem permanecer como uma pasta de feature simples contendo apenas `page` e rota, sem criar subpastas vazias.

## 8. Plano de migração incremental

### Fase 1 — shared e contratos, baixo risco

1. Criar `shared/components/` e mover `empty-state`, `skeleton-loader` e `status-badge`.
2. Ajustar imports diretamente, sem barrel obrigatório.
3. Mover `presentation-labels` para uma localização compartilhada apenas se os tipos forem desacoplados.
4. Extrair interfaces `EventApi`, `CheckoutApi`, `TicketApi` e `ScannerApi` de stores para contratos independentes.
5. Rodar build, testes e lint.

### Fase 2 — features de maior coesão

1. Criar `features/events`, `features/checkout`, `features/orders` e `features/tickets`.
2. Mover páginas e stores relacionados preservando os mesmos exports temporariamente.
3. Manter `loadComponent`, URLs e providers.
4. Corrigir imports de `app.config.ts` e `app.routes.ts` somente após os contratos estarem independentes.
5. Rodar build, testes e lint a cada feature.

### Fase 3 — data-access e fachadas

1. Mover `HttpEventApi` para `features/events/data-access`.
2. Mover APIs de checkout, pedidos e ingressos para seus respectivos `data-access`.
3. Mover `EventDisplayDataService` para `features/events/facade` ou `data-access`.
4. Manter `core` apenas com HTTP base, autenticação, config, access e contratos genuinamente transversais.

### Fase 4 — rotas por feature

1. Criar `events.routes.ts`, `checkout.routes.ts`, `orders.routes.ts`, `tickets.routes.ts` e rotas de admin.
2. Fazer `app.routes.ts` compor apenas grupos de alto nível.
3. Preservar `loadComponent`, `canActivate`, `data.roles` e redirects.

### Fase 5 — limpeza de compatibilidade

1. Remover reexports temporários somente após busca global de referências.
2. Remover pastas antigas vazias.
3. Atualizar documentação e manter uma validação final de release.

## 9. Baixo risco vs alto risco

| Mudança | Risco | Recomendação |
|---|---|---|
| Mover componentes genéricos para `shared/components` | Baixo | Pode ser a primeira fase |
| Extrair interfaces dos stores para contratos | Baixo/Médio | Fazer antes de mover APIs |
| Mover `event-display-data.service.ts` para events | Médio | Fazer com testes de cache e chamadas |
| Mover APIs HTTP para features | Médio | Fazer depois de desacoplar interfaces |
| Mover páginas para features mantendo caminhos compatíveis temporários | Médio | Executar por feature, uma por vez |
| Criar arquivos de rota por feature | Médio | Fazer após a migração das páginas |
| Criar layout principal e remover navbar/footer das páginas | Alto | Adiar; exige QA visual amplo |
| Alterar escopo dos providers de stores | Alto | Não fazer junto com a primeira migração |
| Reorganizar todos os models em uma única etapa | Alto | Fazer somente por domínio e com busca de imports |

## 10. O que manter como está

Devem permanecer em `core` nesta etapa:

- `core/auth/*`;
- `auth.interceptor.ts`, `auth.guard.ts` e `role.guard.ts`;
- `ApiUrlService` e infraestrutura HTTP base;
- `auth.models.ts` e contratos de autenticação;
- `app.config.ts` e providers globais.

Devem ser considerados para `shared`:

- `StatusBadgeComponent`;
- `EmptyStateComponent`;
- `SkeletonLoader`;
- futuros pipes/directives realmente genéricos.

Devem ser considerados para `features`:

- páginas de domínio;
- stores de checkout, eventos, pedidos, ingressos e scanner;
- APIs específicas;
- DTOs e interfaces específicos de cada domínio;
- `EventDisplayDataService`.

Não é necessário criar agora `facade/`, `pipes/`, `directives/` ou subpastas vazias para features que ainda são pequenas.

## 11. Recomendação antes da release

A estrutura atual é aceitável para um MVP e para uma release candidate, desde que os imports invertidos sejam conhecidos e documentados. Não recomendo uma migração massiva para `features/` antes da tag `v0.1.0-rc.1`, porque mover páginas, APIs e providers simultaneamente aumenta o risco de quebrar lazy loading e autenticação.

Recomendo antes da tag apenas:

1. manter a organização atual de rotas por grupos;
2. não criar layout wrapper novo;
3. planejar a extração de contratos como primeira mudança pós-release.

## 12. Próximo prompt sugerido

```text
Execute a Fase 1 da migração estrutural do frontend Angular do Reservae.

Objetivo:
- mover StatusBadgeComponent, EmptyStateComponent e SkeletonLoader para src/app/shared/components;
- extrair EventApi, CheckoutApi, TicketApi e ScannerApi dos stores para contratos independentes;
- corrigir todos os imports sem alterar URLs, endpoints, guards, providers ou comportamento;
- manter compatibilidade temporária apenas quando necessário;
- não mover páginas ou criar features ainda.

Antes:
- buscar todas as referências dos arquivos;
- verificar testes e imports dinâmicos.

Depois:
- rodar npm run build;
- rodar npm test -- --watch=false;
- rodar npm run lint;
- gerar relatório dos arquivos movidos, imports alterados e riscos.
```
