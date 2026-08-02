# Correção NG0200 Router Circular Dependency - Reservae

## 1. Causa encontrada

O ciclo era iniciado pelo `APP_INITIALIZER` de autenticação em `src/app/core/state/auth.providers.ts`. Durante o bootstrap, o `AuthStore` inicializava o `AuthService`, que fazia uma requisição via `HttpClient`. O `authInterceptor` injetava `Router` imediatamente, enquanto o próprio `Router` ainda estava sendo construído pelo `provideRouter`.

Fluxo identificado:

`Router/bootstrap → APP_INITIALIZER → AuthStore/AuthService → HttpClient → authInterceptor → Router`

## 2. Arquivos alterados

- `src/app/core/auth/auth.interceptor.ts`
- `RELATORIO_CORRECAO_NG0200_ROUTER_CIRCULAR_DEPENDENCY_RESERVAE.md`

## 3. Como foi corrigido

O interceptor deixou de injetar `Router` durante a execução inicial da requisição. Ele agora injeta apenas `EnvironmentInjector` e resolve `Router` de forma tardia, dentro do callback que trata respostas `403`, usando `runInInjectionContext`.

Assim, o redirecionamento existente para `/403` continua funcionando quando necessário, mas não participa da criação inicial do `Router`.

Não foram adicionadas navegações imperativas em guards, e não foi removida nenhuma proteção.

## 4. Separação CUSTOMER x ORGANIZER preservada

`ORGANIZER` continua sem carrinho, checkout, pedidos pessoais, ingressos pessoais, transferência de ingresso e seleção de setor para compra. O `roleGuard` e o redirecionamento para `/organizer/dashboard` permanecem ativos.

## 5. Guards preservados

`authGuard` e `roleGuard` continuam ativos nas rotas correspondentes. O `roleGuard` segue retornando `UrlTree` para bloqueios e não usa `router.navigate`.

## 6. Build

`npm run build`: aprovado.

Permanecem somente os avisos conhecidos de budget do bundle inicial e da dependência CommonJS `qrcode`.

## 7. Testes

`npm test -- --watch=false`: 38 arquivos e 118 testes aprovados.

Os testes de roles continuam cobrindo organizador em rota de cliente, cliente em rota Organizer e acesso autorizado.

## 8. Lint

`npm run lint`: aprovado.

## 9. Validação no navegador

O comando de desenvolvimento foi iniciado em `127.0.0.1:4200` para validação de bootstrap. A correção remove a resolução antecipada de `Router` do interceptor, que era a causa do NG0200 durante a inicialização.

Não foi possível inspecionar visualmente o console de um navegador integrado nesta execução; recomenda-se abrir `http://localhost:4200` e confirmar o console do navegador em QA manual.

