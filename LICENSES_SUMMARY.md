# Resumo de licenças — BlocosLab

Este arquivo resume as licenças declaradas pelos quatro repositórios oficiais
clonados em `blocoslab/`. Ele não substitui os textos integrais das licenças
que permanecem nos arquivos `LICENSE` de cada repositório, nem constitui
aconselhamento jurídico.

## Repositórios

| Repositório | Licença declarada | Obrigações principais para redistribuição |
|---|---|---|
| `scratch-gui` | GNU Affero General Public License, versão 3, somente (`AGPL-3.0-only`) | Manter avisos de copyright e o texto da AGPL-3.0. Distribuições de versões modificadas devem fornecer o código-fonte correspondente sob a AGPL-3.0. Se uma versão modificada for operada como serviço de rede para usuários, a seção 13 exige oferecer a esses usuários o código-fonte correspondente da versão em execução. |
| `scratch-vm` | GNU Affero General Public License, versão 3, somente (`AGPL-3.0-only`) | As mesmas obrigações de copyleft da AGPL-3.0: preservar avisos, incluir a licença, disponibilizar o código-fonte correspondente de modificações distribuídas e cumprir a oferta de código-fonte para versões modificadas acessíveis por rede. |
| `scratch-blocks` | Apache License, versão 2.0 (`Apache-2.0`) | Manter avisos de copyright, a cópia da licença e os avisos `NOTICE` aplicáveis. Marcar arquivos modificados de forma destacada. A licença permite redistribuir em fonte ou binário, com ou sem modificações, observando suas condições e a concessão de patentes. |
| `scratch-l10n` | GNU Affero General Public License, versão 3, somente (`AGPL-3.0-only`) | Manter avisos de copyright e o texto da AGPL-3.0; disponibilizar o código-fonte correspondente de versões modificadas distribuídas e cumprir a seção 13 quando a versão modificada for oferecida como serviço de rede. |

### Como aplicar na distribuição

- Preserve os arquivos `LICENSE` dos quatro repositórios e os avisos de
  copyright existentes.
- Mantenha uma atribuição clara para cada componente e registre quais arquivos
  foram modificados.
- Para código coberto pela AGPL-3.0, distribua o código-fonte correspondente
  da versão modificada sob a AGPL-3.0 e inclua as informações exigidas pela
  licença junto ao produto.
- Para código coberto pela Apache-2.0, inclua a licença e os avisos
  `NOTICE` aplicáveis; não remova ou altere avisos obrigatórios.
- A licença não concede autorização para usar marcas registradas do Scratch,
  nem permite presumir endosso pela Scratch Foundation ou pelo MIT.
- Dependências npm instaladas por esses projetos podem ter licenças próprias.
  Antes de distribuir um pacote ou build, gere e revise um inventário de
  licenças das dependências transitivas; este resumo cobre somente os quatro
  repositórios solicitados.

## Nome, logo e outras marcas Scratch

O arquivo `scratch-gui/TRADEMARK` informa que as marcas Scratch, incluindo o
nome Scratch, o logo Scratch, o Scratch Cat e os gráficos Gobo, Pico, Nano,
Tera e Giga, são propriedade do Massachusetts Institute of Technology (MIT).
Ele também informa que essas marcas não podem ser usadas para endossar ou
promover produtos derivados deste software sem autorização prévia e específica
por escrito.

Consequentemente, o produto final deve continuar se chamando **BlocosLab**,
sem usar “Scratch” no nome do produto ou no logo. Não reutilize o logo, os
personagens, os ícones identificadores ou a identidade visual Scratch para
apresentar o produto final. Use as marcas Scratch apenas em referências
descritivas e de atribuição estritamente necessárias, sem sugerir afiliação,
patrocínio ou aprovação; para qualquer uso promocional, consulte o titular da
marca e obtenha autorização por escrito antes da distribuição.

## Fontes locais

- `scratch-gui/LICENSE` e `scratch-gui/TRADEMARK`
- `scratch-vm/LICENSE`
- `scratch-blocks/LICENSE`
- `scratch-l10n/LICENSE`

