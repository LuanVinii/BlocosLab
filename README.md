# BlocosLab

O BlocosLab é uma plataforma alternativa de programação visual por blocos para educação e experimentação com kits de robótica. O projeto busca oferecer uma experiência acessível para criar programas e ampliar, gradualmente, a compatibilidade com diferentes construções e controladoras.

## O que você encontra

- Editor visual para montar programas com blocos.
- Recursos para controlar portas e consultar sensores, conforme o suporte de cada kit.
- Estrutura extensível para integrar outros kits de robótica.

A compatibilidade depende da controladora, dos sensores e dos protocolos implementados para cada kit.

## Executar localmente

Requer Node.js compatível com a versão indicada em `.nvmrc`.

```bash
npm ci
npm start
```

O servidor de desenvolvimento do editor usa a porta `8601` por padrão.

## Gerar o build

```bash
npm run build
```

O build da interface é gerado em `packages/scratch-gui/build`.

## Licenças

O projeto incorpora componentes de código aberto. Consulte `LICENSE` e `LICENSES_SUMMARY.md` para os termos e atribuições aplicáveis.
