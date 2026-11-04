import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.join(root, 'docs', 'responsivo');
const resultsDirectory = path.join(outputDirectory, process.argv[2] || 'antes');
const viewports = [
    [1920, 940],
    [1536, 740],
    [1440, 700],
    [1366, 650],
    [1366, 630],
    [1280, 590],
    [1280, 720],
    [1024, 576],
    [1024, 768]
];
const mobileViewports = [
    [844, 390, 'horizontal'],
    [915, 412, 'horizontal'],
    [740, 360, 'horizontal'],
    [667, 375, 'horizontal'],
    [390, 844, 'vertical'],
    [360, 740, 'vertical']
];
const mobileOnly = process.env.LAYOUT_MOBILE_ONLY === '1';

const getLayout = async page => page.evaluate(() => {
    const rect = element => {
        if (!element) return null;
        const bounds = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
            x: bounds.left,
            y: bounds.top,
            right: bounds.right,
            bottom: bounds.bottom,
            width: bounds.width,
            height: bounds.height,
            visible: bounds.width > 0 && bounds.height > 0 && style.visibility !== 'hidden' &&
                style.display !== 'none'
        };
    };
    const byClass = name => document.querySelector(`[class*="${name}"]`);
    const buttons = [...document.querySelectorAll('button')];
    const byLabel = (matcher, within = document) => [...within.querySelectorAll('button')]
        .find(button => rect(button).visible &&
            matcher.test(`${button.getAttribute('aria-label') || ''} ${button.title || ''}`));
    const tabs = [...document.querySelectorAll('[role="tab"]')].filter(tab => rect(tab).visible);
    const tabMatching = pattern => tabs.find(tab => pattern.test(tab.innerText || tab.getAttribute('aria-label') || ''));
    const spriteSelector = byClass('sprite-selector_sprite-selector');
    const stageSelector = byClass('stage-selector-wrapper');
    const actorList = spriteSelector && spriteSelector.querySelector('[class*="scroll-wrapper"]');
    const actorThumbnail = spriteSelector && spriteSelector.querySelector('[class*="sprite-wrapper"]');
    const actorAdd = spriteSelector && spriteSelector.querySelector('[class*="add-button"]');
    const backdropAdd = stageSelector && stageSelector.querySelector('[class*="add-button"]');
    const toolbox = document.querySelector('.blocklyToolbox');
    const blockArea = byClass('blocks-wrapper');
    const zoomButtons = [...document.querySelectorAll('.blocklyZoom')].map(rect);
    const stageCanvas = [...document.querySelectorAll('canvas')].find(canvas =>
        canvas.width > 0 && canvas.height > 0 && !canvas.className.toString().includes('Compute'));
    const stageSurface = byClass('stage_stage-wrapper');
    const menu = byClass('menu-bar-position');
    const codeTab = byClass('visible-code-tab');
    const stageTabs = [...document.querySelectorAll('[class*="editor-tab"]')].filter(tab => rect(tab).visible);
    const runButton = byLabel(/Start project|Iniciar projeto|Iniciar/);
    const stopButton = byLabel(/Stop project|Parar projeto|Parar/);
    const extensionButton = byLabel(/Add Extension|Adicionar uma Extensão|Adicionar extensão/);
    const kitButton = byLabel(/Kit desconectado|Kit conectado|Procurando o kit/);
    const stageHeader = byClass('stage-header-wrapper');
    const sizeControls = stageHeader && stageHeader.querySelector('[class*="stage-size-row"]');
    const stageSizeButtons = sizeControls ? [...sizeControls.querySelectorAll('button')].filter(button =>
        rect(button).visible) : [];
    const bounds = rect(menu);
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    return {
        viewport: {width: viewportWidth, height: viewportHeight},
        page: {
            width: document.documentElement.scrollWidth,
            height: document.documentElement.scrollHeight,
            verticalScroll: document.documentElement.scrollHeight > viewportHeight + 1,
            horizontalScroll: document.documentElement.scrollWidth > viewportWidth + 1
        },
        elements: {
            menu: rect(menu),
            codeTab: rect(codeTab),
            costumesTab: rect(tabMatching(/Fantasias|Costumes|Cenários|Backdrops/i)),
            soundsTab: rect(tabMatching(/Sons|Sounds/i)),
            run: rect(runButton),
            stop: rect(stopButton),
            stageHeader: rect(stageHeader),
            stage: rect(stageCanvas)?.visible ? rect(stageCanvas) : rect(stageSurface),
            stageSizeButtons: stageSizeButtons.map(rect),
            actorPanel: rect(spriteSelector),
            actorList: rect(actorList),
            actorThumbnail: rect(actorThumbnail),
            addActor: rect(actorAdd),
            stageSelector: rect(stageSelector),
            addBackdrop: rect(backdropAdd),
            categories: rect(toolbox),
            extensionButton: rect(extensionButton && extensionButton.parentElement),
            codeArea: rect(blockArea),
            zoomButtons,
            kit: rect(kitButton)
        },
        menuBottom: bounds ? bounds.bottom : null,
        tabRects: [codeTab, ...stageTabs].filter(Boolean).map(rect),
        visibleButtons: buttons.length
    };
});

const mobileProblemsFor = (layout, orientation, withKit) => {
    const problems = [];
    const elements = layout.elements;
    const {width, height} = layout.viewport;
    if (layout.page.verticalScroll) problems.push(['página', 'rolagem vertical']);
    if (layout.page.horizontalScroll) problems.push(['página', 'rolagem horizontal']);
    if (!layout.mobile.viewportMeta) problems.push(['viewport', 'meta viewport ausente ou incorreta']);

    const required = orientation === 'horizontal' ?
        ['menu', 'run', 'stop', 'stage', 'actorPanel', 'addActor', 'stageSelector', 'addBackdrop',
            'categories', 'extensionButton', 'codeArea'] :
        ['mobileNavigation', 'orientationNotice'];
    if (withKit) required.push('kit');
    for (const name of required) {
        const box = elements[name];
        if (!box || !box.visible) {
            problems.push([name, 'ausente ou invisível']);
        } else if (box.x < -1 || box.y < -1 || box.right > width + 1 || box.bottom > height + 1) {
            problems.push([name, `cortado (${Math.round(box.x)},${Math.round(box.y)}–${Math.round(box.right)},${Math.round(box.bottom)})`]);
        }
    }

    if (orientation === 'horizontal') {
        if (elements.menu && elements.menu.height > 40) problems.push(['menu', `altura ${Math.round(elements.menu.height)} px (>40)`]);
        if (!elements.mobileMenuButton?.visible) problems.push(['menu móvel', 'Preferências e Arquivo não estão em um único botão']);
        if (!elements.propertiesButton?.visible) problems.push(['Propriedades', 'botão ausente']);
        if (elements.actorList && elements.actorList.width < 120) problems.push(['atores', 'faixa de miniaturas estreita']);
        for (const [leftName, left, rightName, right] of [
            ['código', elements.codeArea, 'palco', elements.stage],
            ['palco', elements.stage, 'atores', elements.actorPanel],
            ['Executar', elements.run, 'palco', elements.stage],
            ['Parar', elements.stop, 'palco', elements.stage]
        ]) {
            if (left && right && left.visible && right.visible &&
                Math.min(left.right, right.right) - Math.max(left.x, right.x) > 1 &&
                Math.min(left.bottom, right.bottom) - Math.max(left.y, right.y) > 1) {
                problems.push([`${leftName} × ${rightName}`, 'elementos sobrepostos']);
            }
        }
    } else {
        if (!layout.mobile.codeNav?.visible || !layout.mobile.stageNav?.visible || !layout.mobile.actorsNav?.visible) {
            problems.push(['navegação inferior', 'faltam as seções Código, Palco ou Atores']);
        }
    }

    const touchTargets = orientation === 'horizontal' ?
        ['mobileMenuButton', 'run', 'stop', 'addActor', 'addBackdrop', 'extensionButton', 'kit'] :
        ['mobileMenuButton', 'codeNav', 'stageNav', 'actorsNav', 'kit'];
    for (const name of touchTargets) {
        const box = elements[name];
        if (box && (box.width < 40 || box.height < 40)) {
            problems.push([name, `alvo ${Math.round(box.width)}×${Math.round(box.height)} px (<40)`]);
        }
    }

    if (orientation === 'horizontal') {
        const columns = [['código', elements.codeArea], ['palco e atores', elements.stageHeader]]
            .filter(([, box]) => box && box.visible);
        if (columns.length === 2) {
            const [left, right] = columns.map(([, box]) => box);
            if (Math.min(left.right, right.right) > Math.max(left.x, right.x) + 1) {
                problems.push(['colunas', 'código e palco se sobrepõem']);
            }
        }
    }
    return problems;
};

const getMobileLayout = async page => {
    const layout = await getLayout(page);
    const mobile = await page.evaluate(() => {
        const rect = element => {
            if (!element) return null;
            const bounds = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return {
                x: bounds.left, y: bounds.top, right: bounds.right, bottom: bounds.bottom,
                width: bounds.width, height: bounds.height,
                visible: bounds.width > 0 && bounds.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
            };
        };
        const buttons = [...document.querySelectorAll('button')];
        const byText = text => buttons.find(button => (button.innerText || button.getAttribute('aria-label') || '').trim()
            .toLowerCase() === text.toLowerCase());
        const menuButton = buttons.find(button => /menu/i.test(`${button.title || ''} ${button.getAttribute('aria-label') || ''}`));
        const meta = document.querySelector('meta[name="viewport"]')?.content || '';
        const nav = document.querySelector('[data-testid="mobile-navigation"]');
        const notice = [...document.querySelectorAll('[role="status"], [class*="orientation-notice"]')]
            .find(element => element.textContent.includes('vire o celular na horizontal'));
        return {
            viewportMeta: /width=device-width/.test(meta) && /initial-scale=1/.test(meta) && /viewport-fit=cover/.test(meta),
            menuButton: rect(menuButton),
            propertiesButton: rect(byText('Propriedades')),
            codeNav: rect(byText('Código')),
            stageNav: rect(byText('Palco')),
            actorsNav: rect(byText('Atores')),
            mobileNavigation: rect(nav),
            orientationNotice: rect(notice)
        };
    });
    layout.mobile = mobile;
    layout.elements.mobileMenuButton = mobile.menuButton;
    layout.elements.propertiesButton = mobile.propertiesButton;
    layout.elements.mobileNavigation = mobile.mobileNavigation;
    layout.elements.orientationNotice = mobile.orientationNotice;
    layout.elements.codeNav = mobile.codeNav;
    layout.elements.stageNav = mobile.stageNav;
    layout.elements.actorsNav = mobile.actorsNav;
    return layout;
};

const problemsFor = (layout, withKit) => {
    const problems = [];
    const {width, height} = layout.viewport;
    const elements = layout.elements;
    if (layout.page.verticalScroll) problems.push(['página', 'rolagem vertical']);
    if (layout.page.horizontalScroll) problems.push(['página', 'rolagem horizontal']);

    for (const name of [
        'menu', 'codeTab', 'costumesTab', 'soundsTab', 'run', 'stop', 'stageHeader', 'stage',
        'actorPanel', 'actorList', 'actorThumbnail', 'addActor', 'stageSelector', 'addBackdrop',
        'categories', 'extensionButton', 'codeArea', ...(withKit ? ['kit'] : [])
    ]) {
        const box = elements[name];
        if (!box || !box.visible) {
            problems.push([name, 'ausente ou invisível']);
        } else if (box.x < -1 || box.y < -1 || box.right > width + 1 || box.bottom > height + 1) {
            problems.push([name, `cortado (${Math.round(box.x)},${Math.round(box.y)}–${Math.round(box.right)},${Math.round(box.bottom)})`]);
        }
    }

    for (const [index, box] of elements.zoomButtons.entries()) {
        if (!box.visible || box.x < -1 || box.y < -1 || box.right > width + 1 || box.bottom > height + 1 ||
            (elements.codeArea && box.bottom > elements.codeArea.bottom + 1)) {
            problems.push([`controle de zoom ${index + 1}`, 'cortado ou fora da janela']);
        }
    }

    if (elements.codeArea && elements.codeArea.height < 240) {
        problems.push(['área de código', `altura ${Math.round(elements.codeArea.height)} px (<240)`]);
    }
    if (elements.actorList && elements.actorList.height < 64) {
        problems.push(['lista de atores', `altura ${Math.round(elements.actorList.height)} px (<64)`]);
    }
    if (elements.actorThumbnail && elements.actorList &&
        (elements.actorThumbnail.y < elements.actorList.y || elements.actorThumbnail.bottom > elements.actorList.bottom + 1)) {
        problems.push(['miniatura do ator', 'não cabe inteira na lista']);
    }
    for (const name of ['run', 'stop']) {
        const box = elements[name];
        if (box && layout.menuBottom !== null && box.y - layout.menuBottom < 6) {
            problems.push([name === 'run' ? 'Executar' : 'Parar', `distância da barra de menu ${Math.round(box.y - layout.menuBottom)} px (<6)`]);
        }
    }
    for (const name of ['run', 'stop']) {
        const control = elements[name];
        if (!control) continue;
        for (const tab of layout.tabRects) {
            const horizontalOverlap = Math.min(control.right, tab.right) - Math.max(control.x, tab.x);
            const verticalOverlap = Math.min(control.bottom, tab.bottom) - Math.max(control.y, tab.y);
            const gap = horizontalOverlap > 0 ?
                (verticalOverlap > 0 ? -Math.min(horizontalOverlap, verticalOverlap) :
                    Math.max(tab.y - control.bottom, control.y - tab.bottom)) :
                (verticalOverlap > 0 ? Math.max(tab.x - control.right, control.x - tab.right) :
                    Math.hypot(Math.max(tab.x - control.right, control.x - tab.right),
                        Math.max(tab.y - control.bottom, control.y - tab.bottom)));
            if (gap < 6) problems.push([name === 'run' ? 'Executar' : 'Parar', `distância da aba ${Math.round(gap)} px (<6)`]);
        }
    }
    const interactive = [
        ['Código', elements.codeTab], ['Executar', elements.run], ['Parar', elements.stop],
        ['Adicionar ator', elements.addActor], ['Adicionar cenário', elements.addBackdrop],
        ...elements.stageSizeButtons.map((button, index) => [`Tamanho do palco ${index + 1}`, button])
    ];
    for (const [name, box] of interactive) {
        if (box && (box.width < 36 || box.height < 36)) {
            problems.push([name, `alvo ${Math.round(box.width)}×${Math.round(box.height)} px (<36)`]);
        }
    }
    for (const [index, box] of elements.stageSizeButtons.entries()) {
        if (!box.visible || box.x < -1 || box.y < -1 || box.right > width + 1 || box.bottom > height + 1) {
            problems.push([`controle de palco ${index + 1}`, 'ausente, cortado ou invisível']);
        }
    }

    const keyBoxes = [
        ['Executar', elements.run], ['Parar', elements.stop], ['palco', elements.stage],
        ['lista de atores', elements.actorList], ['seletor de cenário', elements.stageSelector],
        ['categorias', elements.categories], ['área de código', elements.codeArea]
    ].filter(([, box]) => box && box.visible);
    for (let i = 0; i < keyBoxes.length; i++) {
        for (let j = i + 1; j < keyBoxes.length; j++) {
            const [leftName, left] = keyBoxes[i];
            const [rightName, right] = keyBoxes[j];
            const overlapWidth = Math.min(left.right, right.right) - Math.max(left.x, right.x);
            const overlapHeight = Math.min(left.bottom, right.bottom) - Math.max(left.y, right.y);
            const leftContainsRight = left.x <= right.x && left.y <= right.y &&
                left.right >= right.right && left.bottom >= right.bottom;
            const rightContainsLeft = right.x <= left.x && right.y <= left.y &&
                right.right >= left.right && right.bottom >= left.bottom;
            if (overlapWidth > 1 && overlapHeight > 1 && !leftContainsRight && !rightContainsLeft) {
                problems.push([`${leftName} × ${rightName}`, 'elementos sobrepostos']);
            }
        }
    }
    return problems;
};

const activateKit = async page => {
    const extensionButton = page.locator('[class*="extension-button-container"] button');
    await extensionButton.click();
    await page.locator('#kitrobotica').waitFor({state: 'visible', timeout: 10000});
    await page.locator('#kitrobotica').click();
    await page.locator('button[aria-label^="Kit desconectado"], button[aria-label^="Kit conectado"]')
        .waitFor({state: 'visible', timeout: 15000});
    await page.evaluate(() => window.scrollTo(0, 0));
};

const run = async () => {
    await fs.mkdir(resultsDirectory, {recursive: true});
    const browser = await chromium.launch({headless: true});
    const failures = [];
    const rows = [];
    const page = await browser.newPage({viewport: {width: 1366, height: 650}});
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(60000);
    await page.goto('http://127.0.0.1:8601/', {waitUntil: 'commit', timeout: 60000});
    await page.locator('.blocklyToolbox').waitFor({state: 'visible', timeout: 60000});
    await page.waitForFunction(() => !document.body.innerText.includes('Carregando o BlocosLab'), null, {timeout: 60000});
    await page.evaluate(() => window.scrollTo(0, 0));

    if (!mobileOnly) for (const [width, height] of viewports) {
        await page.setViewportSize({width, height});
        await page.waitForTimeout(150);
        const layout = await getLayout(page);
        const problems = problemsFor(layout, false);
        const size = `${width}x${height}`;
        await page.screenshot({path: path.join(resultsDirectory, `${size}-sem-kit.png`)});
        for (const [element, problem] of problems) {
            rows.push({size, extension: 'sem kit', element, problem});
            failures.push({size, extension: 'sem kit', element, problem});
        }

        try {
            await activateKit(page);
            await page.waitForTimeout(150);
            const kitLayout = await getLayout(page);
            const kitProblems = problemsFor(kitLayout, true);
            await page.screenshot({path: path.join(resultsDirectory, `${size}-com-kit.png`)});
            for (const [element, problem] of kitProblems) {
                rows.push({size, extension: 'com kit', element, problem});
                failures.push({size, extension: 'com kit', element, problem});
            }
        } catch (error) {
            rows.push({size, extension: 'com kit', element: 'Kit Robótica', problem: `não foi possível adicionar (${error.message})`});
            failures.push({size, extension: 'com kit', element: 'Kit Robótica', problem: `não foi possível adicionar (${error.message})`});
        }

        if (height !== viewports.at(-1)[1] || width !== viewports.at(-1)[0]) {
            await page.reload({waitUntil: 'commit'});
            await page.locator('.blocklyToolbox').waitFor({state: 'visible', timeout: 60000});
            await page.waitForFunction(() => !document.body.innerText.includes('Carregando o BlocosLab'), null, {timeout: 60000});
            await page.evaluate(() => window.scrollTo(0, 0));
        }
    }

    const reportPath = path.join(resultsDirectory, 'falhas.json');
    await fs.writeFile(reportPath, `${JSON.stringify(failures, null, 2)}\n`);

    const mobileDirectory = path.join(outputDirectory, `${process.argv[2] || 'antes'}-mobile`);
    await fs.mkdir(mobileDirectory, {recursive: true});
    for (const [width, height, orientation] of mobileViewports) {
        const mobilePage = await browser.newPage({
            viewport: {width, height},
            deviceScaleFactor: 1,
            isMobile: true,
            hasTouch: true
        });
        mobilePage.setDefaultTimeout(15000);
        mobilePage.setDefaultNavigationTimeout(60000);
        await mobilePage.goto('http://127.0.0.1:8601/', {waitUntil: 'commit', timeout: 60000});
        await mobilePage.locator('.blocklyToolbox').waitFor({state: 'visible', timeout: 60000});
        await mobilePage.waitForFunction(() => !document.body.innerText.includes('Carregando o BlocosLab'), null, {timeout: 60000});
        const mobileSize = `${width}x${height}`;
        let mobileLayout = await getMobileLayout(mobilePage);
        let mobileProblems = mobileProblemsFor(mobileLayout, orientation, false);
        await mobilePage.screenshot({path: path.join(mobileDirectory, `${mobileSize}-sem-kit.png`)});
        for (const [element, problem] of mobileProblems) {
            rows.push({size: mobileSize, extension: 'sem kit', element, problem});
            failures.push({size: mobileSize, extension: 'sem kit', element, problem});
        }
        await mobilePage.locator('[data-testid="mobile-menu-button"]').click();
        const menuPanel = mobilePage.locator('[class*="mobile-menu-panel"]');
        if (!await menuPanel.isVisible() ||
            await menuPanel.getByText('Preferências', {exact: true}).count() === 0 ||
            await menuPanel.getByText('Arquivo', {exact: true}).count() === 0 ||
            await menuPanel.getByRole('button', {name: 'Preferências', exact: true}).count() === 0 ||
            await menuPanel.getByRole('button', {name: 'Novo', exact: true}).count() === 0 ||
            await menuPanel.getByRole('button', {name: 'Carregar do computador', exact: true}).count() === 0 ||
            await menuPanel.getByRole('button', {name: 'Salvar no computador', exact: true}).count() === 0 ||
            await menuPanel.getByRole('button', {name: 'Nome do projeto', exact: true}).count() === 0) {
            const problem = 'o botão único não mostra os nomes das opções de Preferências e Arquivo';
            rows.push({size: mobileSize, extension: 'sem kit', element: 'menu móvel', problem});
            failures.push({size: mobileSize, extension: 'sem kit', element: 'menu móvel', problem});
        }
        await mobilePage.locator('[data-testid="mobile-menu-button"]').click();
        if (orientation === 'horizontal') {
            const propertiesButton = mobilePage.getByRole('button', {name: 'Propriedades', exact: true});
            const propertiesBounds = await propertiesButton.boundingBox();
            if (!propertiesBounds || propertiesBounds.width > 140 || propertiesBounds.height < 32) {
                const problem = 'o botão Propriedades está ausente ou ocupa espaço excessivo';
                rows.push({size: mobileSize, extension: 'sem kit', element: 'Propriedades', problem});
                failures.push({size: mobileSize, extension: 'sem kit', element: 'Propriedades', problem});
            } else {
                await propertiesButton.click();
                const spriteInfo = mobilePage.locator('[class*="sprite-info_sprite-info"]').first();
                const infoBounds = await spriteInfo.boundingBox();
                if (!infoBounds || infoBounds.width < 1 || infoBounds.height < 1 ||
                    infoBounds.x < 0 || infoBounds.x + infoBounds.width > width + 1 || infoBounds.y < 0) {
                    const problem = 'as propriedades não abrem em um painel visível e dentro da tela';
                    rows.push({size: mobileSize, extension: 'sem kit', element: 'Propriedades', problem});
                    failures.push({size: mobileSize, extension: 'sem kit', element: 'Propriedades', problem});
                }
                await propertiesButton.click();
            }
        }
        try {
            await activateKit(mobilePage);
            await mobilePage.waitForTimeout(150);
            mobileLayout = await getMobileLayout(mobilePage);
            mobileProblems = mobileProblemsFor(mobileLayout, orientation, true);
            await mobilePage.screenshot({path: path.join(mobileDirectory, `${mobileSize}-com-kit.png`)});
            for (const [element, problem] of mobileProblems) {
                rows.push({size: mobileSize, extension: 'com kit', element, problem});
                failures.push({size: mobileSize, extension: 'com kit', element, problem});
            }

            if (orientation === 'vertical') {
                await mobilePage.getByRole('button', {name: 'Fechar aviso', exact: true}).click();
                if (await mobilePage.getByRole('status').filter({hasText: 'vire o celular na horizontal'}).count()) {
                    const problem = 'o aviso de orientação não foi dispensado';
                    rows.push({size: mobileSize, extension: 'com kit', element: 'aviso', problem});
                    failures.push({size: mobileSize, extension: 'com kit', element: 'aviso', problem});
                }
                const expected = [
                    ['Código', 'codeArea', 'stage'],
                    ['Palco', 'stage', 'actorPanel'],
                    ['Atores', 'actorPanel', 'stage']
                ];
                for (const [label, visibleElement, hiddenElement] of expected) {
                    await mobilePage.getByRole('button', {name: label, exact: true}).click();
                    await mobilePage.waitForTimeout(100);
                    const panelLayout = await getMobileLayout(mobilePage);
                    const shown = visibleElement === 'codeArea' ? panelLayout.elements.codeArea :
                        panelLayout.elements[visibleElement];
                    const hidden = panelLayout.elements[hiddenElement];
                    if (!shown?.visible || !hidden || hidden.visible) {
                        const problem = `seção ${label} não aparece sozinha`;
                        rows.push({size: mobileSize, extension: 'com kit', element: 'navegação inferior', problem});
                        failures.push({size: mobileSize, extension: 'com kit', element: 'navegação inferior', problem});
                    }
                    if (!panelLayout.elements.kit?.visible) {
                        const problem = 'ícone do kit deixou de ficar visível ao trocar de seção';
                        rows.push({size: mobileSize, extension: 'com kit', element: 'Kit Robótica', problem});
                        failures.push({size: mobileSize, extension: 'com kit', element: 'Kit Robótica', problem});
                    }
                }
            }
        } catch (error) {
            const problem = `não foi possível adicionar (${error.message})`;
            rows.push({size: mobileSize, extension: 'com kit', element: 'Kit Robótica', problem});
            failures.push({size: mobileSize, extension: 'com kit', element: 'Kit Robótica', problem});
        }
        await mobilePage.close();
    }

    await fs.writeFile(reportPath, `${JSON.stringify(failures, null, 2)}\n`);
    console.log(`Capturas: ${resultsDirectory}`);
    console.log(`Falhas: ${failures.length}`);
    console.log('tamanho | estado | elemento | problema');
    console.log('---|---|---|---');
    for (const row of rows) console.log(`${row.size} | ${row.extension} | ${row.element} | ${row.problem}`);
    await browser.close();
};

run().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
