# Reservae Frontend

<div align="center">
  <a href="https://github.com/RaphaelMun1z/Angular-Reservae/releases">
    <img src="https://img.shields.io/github/v/release/RaphaelMun1z/Angular-Reservae?label=frontend&style=for-the-badge&color=6C63FF" alt="Última versão do frontend">
  </a>
  <a href="https://github.com/RaphaelMun1z/Angular-Reservae">
    <img src="https://img.shields.io/badge/frontend-Angular%2021-DD0031?style=for-the-badge&logo=angular&logoColor=white" alt="Frontend Angular 21">
  </a>
  <img src="https://img.shields.io/badge/status-Prot%C3%B3tipo%20naveg%C3%A1vel-22C55E?style=for-the-badge" alt="Status: Protótipo navegável">
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript 5.9">
  <img src="https://img.shields.io/badge/Tailwind%20CSS-4.3-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4.3">
  <img src="https://img.shields.io/badge/npm-11.16-CB3837?style=for-the-badge&logo=npm&logoColor=white" alt="npm 11.16">
</div>

Interface web do **Reservae**, plataforma de venda e gestão de ingressos para eventos. Este frontend representa a experiência de participantes e organizadores, cobrindo descoberta de eventos, seleção de setor, checkout, ingressos digitais, transferência de ingressos, área do usuário e painel administrativo.

> **Versão atual do frontend:** `0.0.0`<br>
> **Estágio:** protótipo navegável em Angular

## Visão geral

O projeto foi construído como uma aplicação Angular standalone, com rotas declaradas em `src/app/app.routes.ts`, componentes de página em `src/app/pages` e assets visuais em `src/app/assets`. A interface utiliza uma identidade visual escura, destaque em coral, layouts responsivos e telas específicas para os principais fluxos do produto.

## Preview do projeto

<div align="center">

<table>
  <tr>
    <td align="center" width="50%">
      <img src="./src/app/assets/previews/inicio.png" alt="Página inicial do Reservae" width="100%">
      <br>
      <strong>Página inicial</strong>
    </td>
    <td align="center" width="50%">
      <img src="./src/app/assets/previews/shows.png" alt="Vitrine de shows do Reservae" width="100%">
      <br>
      <strong>Vitrine de shows</strong>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="./src/app/assets/previews/eventos.png" alt="Listagem de eventos do Reservae" width="100%">
      <br>
      <strong>Listagem de eventos</strong>
    </td>
    <td align="center" width="50%">
      <img src="./src/app/assets/previews/selecionar-setor.png" alt="Seleção de setor do Reservae" width="100%">
      <br>
      <strong>Seleção de setor</strong>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="./src/app/assets/previews/checkout.png" alt="Checkout do Reservae" width="100%">
      <br>
      <strong>Checkout</strong>
    </td>
    <td align="center" width="50%">
      <img src="./src/app/assets/previews/meus-ingressos.png" alt="Ingressos digitais do Reservae" width="100%">
      <br>
      <strong>Meus ingressos</strong>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="./src/app/assets/previews/detalhes-ingresso.png" alt="Detalhes do ingresso digital do Reservae" width="100%">
      <br>
      <strong>Ingresso digital</strong>
    </td>
    <td align="center" width="50%">
      <img src="./src/app/assets/previews/dashboard.png" alt="Dashboard administrativo do Reservae" width="100%">
      <br>
      <strong>Dashboard administrativo</strong>
    </td>
  </tr>
</table>

</div>

## Rotas principais

| Rota | Página |
| :--- | :----- |
| `/inicio` | Página inicial |
| `/shows` | Vitrine de shows |
| `/eventos` | Listagem de eventos |
| `/selecionar-setor` | Seleção de setor |
| `/checkout` | Checkout |
| `/avaliacao` | Revisão da compra |
| `/sucesso` | Compra concluída |
| `/meus-ingressos` | Ingressos do usuário |
| `/detalhes-ingresso` | Detalhes do ingresso digital |
| `/transferir-ingresso` | Transferência de ingresso |
| `/scanner` | Scanner de acesso |
| `/dashboard` | Painel administrativo |
| `/criar-evento` | Criação de evento |
| `/perfil` | Perfil do usuário |
| `/configuracoes` | Configurações |
| `/suporte` | Suporte |

## Stack tecnológica

- **Angular 21:** base da aplicação frontend.
- **Angular Router:** navegação entre páginas e fluxos.
- **TypeScript 5.9:** linguagem principal do projeto.
- **SCSS:** estilos globais e estilos por componente.
- **Tailwind CSS 4:** tokens utilitários, tema visual e composição de layout.
- **RxJS:** suporte reativo usado pelo ecossistema Angular.
- **Vitest e jsdom:** ambiente de testes configurado pelo Angular.
- **angular-cli-ghpages:** publicação da build no GitHub Pages.

## Status das integrações

| Status | Serviço | Responsabilidade | Páginas previstas |
| :----: | :------ | :---------------- | :---------------- |
| ⚪ | User Profile Service | Dados de perfil do participante e organizador | `/perfil`, `/configuracoes`, `/cadastro`, `/dashboard` |
| ⚪ | Event Catalog Service | Catálogo de eventos, locais, categorias e detalhes de apresentação | `/inicio`, `/shows`, `/eventos`, `/club-vip`, `/criar-evento`, `/dashboard` |
| ⚪ | Inventory Service | Disponibilidade de setores, lotes e ingressos reserváveis | `/selecionar-setor`, `/checkout`, `/dashboard`, `/criar-evento` |
| ⚪ | Order Service | Criação, consulta e acompanhamento de pedidos | `/avaliacao`, `/checkout`, `/sucesso`, `/meus-ingressos`, `/dashboard` |
| ⚪ | Payment Service | Dados de pagamento, status da transação e confirmação do checkout | `/checkout`, `/sucesso`, `/dashboard` |
| ⚪ | Ticket Service | Emissão, consulta, transferência e validação de ingressos | `/meus-ingressos`, `/detalhes-ingresso`, `/transferir-ingresso`, `/scanner` |
| ⚪ | Notification Service | Histórico e preferências de notificações relacionadas à conta e aos eventos | `/suporte`, `/perfil`, `/configuracoes`, `/dashboard` |

> Legenda: `⚪` planejado, `🟡` em desenvolvimento, `✅` integrado.

## Como executar localmente

### Pré-requisitos

- Node.js compatível com Angular 21;
- npm 11 ou superior.

### 1. Instale as dependências

```bash
npm install
```

### 2. Inicie o servidor de desenvolvimento

```bash
npm start
```

A aplicação ficará disponível em:

```text
http://localhost:4200
```

### 3. Gere uma build de produção

```bash
npm run build
```

Os arquivos compilados serão gerados em `dist/`.

## Scripts disponíveis

| Script | Descrição |
| :----- | :-------- |
| `npm start` | Inicia o servidor local com `ng serve` |
| `npm run build` | Gera a build de produção |
| `npm run watch` | Gera build em modo observação para desenvolvimento |
| `npm test` | Executa os testes unitários |
| `npm run github-build` | Gera build com `base-href` configurado para GitHub Pages |
| `npm run github-deploy` | Publica o conteúdo gerado no GitHub Pages |

## Deploy no GitHub Pages

Para publicar a aplicação:

```bash
npm run github-build
npm run github-deploy
```

O script de build usa o `base-href`:

```text
https://raphaelmuniz.github.io/Angular-Reservae/
```

## Relato de bugs

Encontrou um comportamento inesperado? Abra uma issue no repositório com uma descrição objetiva, os passos para reproduzir, o resultado esperado e, quando possível, capturas de tela ou logs do navegador.
