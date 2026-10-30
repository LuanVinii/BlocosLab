# Mapeamento do Robotmaster (Bluetooth Mode)

Este documento registra os blocos e as opções visíveis em **Robotmaster(Bluetooth Mode)** no Makerzoid Lab 2.1.6. Ele serve como referência para adicionar comandos ao Kit Robótica do BlocosLab.

## Blocos disponíveis

O plugin apresenta 13 blocos:

| Tipo | Rótulo observado | Campos e opções |
| --- | --- | --- |
| Comando | `set [luzes] color to [cor]` | Luzes: `all lights`, `light1`, `light2`. Cores: `red`, `orange`, `yellow`, `green`, `cyan`, `blue`, `purple`. |
| Comando | `turn the [luzes] off` | Luzes: `all lights`, `light1`, `light2`. |
| Comando | `set [porta] to speed [valor] on [sentido] rotation` | Portas: `all ports`, `port1`, `port2`, `port3`. Valor numérico padrão: `6`. Sentidos: `clockwise`, `anticlockwise`. |
| Comando | `stop motor on [porta]` | Portas: `all ports`, `port1`, `port2`, `port3`. |
| Repórter numérico | `distance sensor 1` | Leitura do sensor de distância 1. |
| Repórter numérico | `distance sensor 2` | Leitura do sensor de distância 2. |
| Repórter numérico | `gyro's x-axis angle` | Ângulo do eixo X do giroscópio. |
| Repórter numérico | `gyro's y-axis angle` | Ângulo do eixo Y do giroscópio. |
| Repórter numérico | `gyro's sum of acceleration` | Soma da aceleração do giroscópio. |
| Evento | `when distance [sensor] [comparador] [valor]` | Sensor: `1` ou `2`. Comparador: `<` ou `>`. Valor numérico padrão: `3`. |
| Evento | `when tilted [direção]` | Direções: `front`, `back`, `left`, `right`, `any`. |
| Booleano | `tilted? [direção]` | Direções: `front`, `back`, `left`, `right`, `any`. |
| Booleano | `are line trackers matched state: left [estado] and right [estado]?` | Estado de cada rastreador: `on` ou `off`, gerando quatro combinações. |

## Resumo das opções

- **Luzes:** dois alvos individuais e o alvo combinado (`light1`, `light2`, `all lights`).
- **Cores:** sete opções (`red`, `orange`, `yellow`, `green`, `cyan`, `blue`, `purple`).
- **Portas de motor:** três portas individuais e o grupo (`port1`, `port2`, `port3`, `all ports`).
- **Rotação:** `clockwise` e `anticlockwise`.
- **Sensores de distância:** sensores 1 e 2; o bloco de evento compara com `<` ou `>` e recebe um valor numérico.
- **Inclinação:** `front`, `back`, `left`, `right` ou `any`.
- **Rastreadores de linha:** cada lado pode estar `on` ou `off`.

## Limites deste mapeamento

O levantamento inicial cobria os blocos e as opções da interface. As capturas abaixo acrescentam o protocolo observado para os motores 1 e 2 na velocidade 10 e a parada geral. Ainda não estão confirmados os limites de velocidade, outras velocidades, a porta 3 nem o protocolo dos sensores, inclinação, rastreadores de linha e luzes.

## Protocolo de motores — capturas verificadas

Capturas do Console do Makerzoid durante o programa de controle por setas, com o kit conectado. Cada quadro tem 14 bytes. Os quadros abaixo foram comparados com o movimento físico informado pelo usuário:

| Ação | Quadro hexadecimal | Efeito observado |
| --- | --- | --- |
| Seta para cima | `FF FE 09 01 02 0A 00 00 00 00 00 00 FD FC` | Porta 1 em +10; base sobe |
| Seta para baixo | `FF FE 09 01 02 F6 00 00 00 00 00 00 FD FC` | Porta 1 em −10; base desce |
| Seta para a esquerda | `FF FE 09 01 02 00 0A 00 00 00 00 00 FD FC` | Porta 2 em +10; guindaste gira à esquerda |
| Seta para a direita | `FF FE 09 01 02 00 F6 00 00 00 00 00 FD FC` | Porta 2 em −10; guindaste gira à direita |
| Seta para a direita, velocidade 5 | `FF FE 09 01 02 00 FB 00 00 00 00 00 FD FC` | Porta 2 em −5; guindaste gira à direita |
| Espaço (parar todos) | `FF FE 09 01 02 00 00 00 00 00 00 00 FD FC` | Para a execução dos motores |

### Interpretação dos bytes

- `FF FE` inicia o quadro; `FD FC` encerra.
- `09 01 02` é o prefixo observado nos cinco quadros. O byte `09` é compatível com o tamanho do conteúdo entre o byte de tamanho e o terminador, mas isso ainda é uma inferência estrutural.
- Os bytes de dados nas posições 5, 6 e 7 (contagem iniciada em zero) correspondem, respectivamente, às portas 1, 2 e 3. Os quatro bytes seguintes permaneceram `00` nas capturas.
- `0A` é +10; `FB` é −5; `F6` é −10 na representação de 8 bits em complemento de dois (251 e 246 sem sinal, respectivamente). As duas capturas negativas da porta 2 sustentam a hipótese de que a magnitude da velocidade é codificada diretamente no byte com sinal.
- Para parar, o plugin envia zeros em todos os canais de motor no mesmo tipo de quadro.

O mapeamento de direção e velocidade 10 foi verificado para as portas 1 e 2; a velocidade 5 foi verificada para a porta 2 no sentido anti-horário. A codificação direta de outras velocidades é uma inferência, ainda não uma validação de faixa. Porta 3, limites aceitos e a semântica completa do campo `09` precisam de captura própria.
