# Como adicionar itens às bibliotecas

O editor carrega quatro listas JSON em `packages/scratch-gui/src/lib/libraries/`:

- `sprites.json`: atores, com fantasias e sons incorporados a cada ator.
- `costumes.json`: fantasias avulsas.
- `backdrops.json`: cenários avulsos.
- `sounds.json`: sons avulsos.

Os JSON carregados pelo editor usam metadados de mídia. Exemplo de um ator com uma fantasia e sem sons:

```json
{
  "name": "Robô",
  "tags": ["robótica", "educação"],
  "isStage": false,
  "costumes": [
    {
      "name": "Robô",
      "assetId": "f2194c30f3b685f54133d79e93bae963",
      "md5ext": "f2194c30f3b685f54133d79e93bae963.png",
      "dataFormat": "png",
      "bitmapResolution": 2,
      "rotationCenterX": 100,
      "rotationCenterY": 100,
      "tags": ["robótica", "educação"]
    }
  ],
  "sounds": []
}
```

Uma fantasia ou cenário usa `name`, `assetId`, `md5ext`, `dataFormat`, `bitmapResolution`, `rotationCenterX`, `rotationCenterY` e `tags`. Para som, use `name`, `assetId`, `md5ext`, `dataFormat`, `tags`, `rate` e `sampleCount`. `assetId` é o MD5 do arquivo; `md5ext` é esse identificador seguido da extensão. Use os formatos de imagem PNG, SVG, BMP ou JPG, e WAV ou MP3 para som.

Para preparar conteúdo novo, crie pastas por tipo em `packages/scratch-media-lib-scripts/media/editor/`: `sprites/`, `costumes/`, `backdrops/` e `sounds/`. Dentro da pasta do item, mantenha um manifesto JSON e os arquivos que ele referencia com `file`. Em atores, o manifesto contém `sprites` (com referências pelo nome), `costumes` e, se necessário, `sounds`. Exemplo de ator:

```json
{
  "sprites": [{"name": "Robô", "tags": ["robótica"], "costumes": ["Robô"], "sounds": []}],
  "costumes": [{"name": "Robô", "file": "robo.png", "bitmapResolution": 2, "rotationCenterX": 100, "rotationCenterY": 100}]
}
```

Confira o formato completo em `packages/scratch-media-lib-scripts/schemas/media-collection-schema.json`. Gere as listas com `node packages/scratch-media-lib-scripts/scripts/build_media_libraries.js packages/scratch-media-lib-scripts/media/editor --output`. O script grava os JSON em `output/`; copie as listas geradas para `packages/scratch-gui/src/lib/libraries/`. Ele calcula identificadores e junta as fantasias e sons dos atores.

Os binários referenciados por `md5ext` precisam estar disponíveis pelo serviço de mídia configurado no editor. Sem uma origem de biblioteca específica, a GUI usa `https://cdn.assets.scratch.mit.edu/internalapi/asset/{md5ext}/get/`. Para hospedar os arquivos MicroKids, publique-os no serviço de mídia próprio e configure o `storage` do editor para servir esses mesmos identificadores; miniaturas e seleção usam a URL retornada por `getLibraryAssetUrl`.

Os dados originais das quatro bibliotecas estão preservados em `backup-scratch-libs/`. Os arquivos de mídia originais do Scratch continuam no projeto.
