// ==UserScript==
// @name         Inkarnate-grid
// @namespace    https://github.com/meelkor/inkarnate-grid
// @version      1.0.0
// @description  Browser user-script that adds additional grid types into inkarnate
// @author       Jan Seda
// @match        https://inkarnate.com/maps/edit/*
// @grant        none
// ==/UserScript==

const __INKARNATE_GRID_PATTERN_DICT = {
    'hex-pointy': {
        width: 387.113671,
        height: 670.5,
        content: `<path d='M 193.556671 223.5 L 387.113671 335.25 L 387.113671 558.75 L 193.556671 670.5 L 0 558.75 M 193.556671 223.5 L 0 335.25 M 193.556671 223.5 L 193.556671 0'/>`,
    },
};

(function () {
    const options: GridOptions = {
        patternId: 'none',
        scale: 1,
        offsetX: 0,
        offsetY: 0,
    };

    const LOCAL_STORAGE_KEY = '$$INKARNATE_GRID_OPTIONS';

    const STROKE_WIDTH = 1;

    let containerInfo: ContainerInfo | undefined;

    onInkarnateReady(() => {
        loadOptions();
        createUi();
        updateGrid();
    });

    function onInkarnateReady(onReady: Function): void {
        setTimeout(() => {
            try {
                findRequiredElements();
                onReady();
            } catch (e) {
                if (e instanceof NotReadyError) {
                    onInkarnateReady(onReady);
                } else {
                    console.error('Inkarnate-grid init failed:', e);
                }
            }
        }, 2500);
    }

    function createUi() {
        // Pattern type select input
        const select = document.createElement('select');

        for (const key of ['none', ...Object.keys(__INKARNATE_GRID_PATTERN_DICT)]) {
            const option = document.createElement('option');

            option.value = key;
            option.innerText = key;

            select.append(option);
        }

        select.value = options.patternId;

        select.addEventListener('change', () => {
            options.patternId = select.value as KnownPatternId;
            updateGrid();
        });

        // Put them into footer bar
        const { bottomKeybindings } = findRequiredElements();

        bottomKeybindings.parentElement.insertBefore(select, bottomKeybindings);

        bottomKeybindings.parentElement.insertBefore(
            makeRangeInput('0.01', '2', '0.001', 'scale'),
            bottomKeybindings,
        );

        bottomKeybindings.parentElement.insertBefore(
            makeRangeInput('0', '1', '0.01', 'offsetX'),
            bottomKeybindings,
        );

        bottomKeybindings.parentElement.insertBefore(
            makeRangeInput('0', '1', '0.01', 'offsetY'),
            bottomKeybindings,
        );
    }

    function makeRangeInput(min: string, max: string, step: string, optionKey: keyof GridOptions): HTMLInputElement {
        const rangeInput = document.createElement('input');

        rangeInput.type = 'range';
        rangeInput.min = min;
        rangeInput.max = max;
        rangeInput.step = step;
        rangeInput.value = `${options[optionKey]}`;
        rangeInput.title = optionKey;

        rangeInput.addEventListener('change', () => {
            (options[optionKey] as any) = parseFloat(rangeInput.value);
            updateGrid();
        });

        return rangeInput;
    }

    function updateGrid(): void {
        storeOptions();

        const { container, width, height } = createGridContainer();

        if (options.patternId === 'none') {
            container.innerHTML = '';
        } else {
            const pattern = __INKARNATE_GRID_PATTERN_DICT[options.patternId];

            const repeatX = `${options.scale * (pattern.width / width) * 100}%`;
            const repeatY = `${options.scale * (pattern.height / height) * 100}%`;

            const offsetX = `${options.offsetX * (pattern.width / width) * 100}%`;
            const offsetY = `${options.offsetY * (pattern.height / height) * 100}%`;

            container.innerHTML = `
                <svg
                    width='${width}'
                    height='${height}'
                    viewBox='0 0 ${width} ${height}'
                    style='width: 100%; height: 100%'
                    xmlns='http://www.w3.org/2000/svg'
                >
                    <defs>
                        <pattern
                            id='grid-pattern'
                            viewBox='0 0 ${pattern.width} ${pattern.height}'
                            x='${offsetX}'
                            y='${offsetY}'
                            width='${repeatX}'
                            height='${repeatY}'
                        >
                            <g stroke='black' fill='none' stroke-width='${STROKE_WIDTH / options.scale}'>
                                ${pattern.content}
                            </g>
                        </pattern>
                    </defs>

                    <rect fill='url(#grid-pattern)' width='${width}' height='${height}'/>
                </svg>
            `;
        }
    }

    function createGridContainer(): ContainerInfo {
        if (containerInfo) {
            return containerInfo;
        }

        const { editorCanvases } = findRequiredElements();

        const canvasWidth = editorCanvases.clientWidth;
        const canvasHeight = editorCanvases.clientHeight;

        const gridSvgContainer = document.createElement('div');

        gridSvgContainer.style.pointerEvents = 'none';
        gridSvgContainer.style.width = `${canvasWidth}px`;
        gridSvgContainer.style.height = `${canvasHeight}px`;
        gridSvgContainer.style.position = 'absolute';

        editorCanvases.appendChild(gridSvgContainer);

        containerInfo = {
            container: gridSvgContainer,
            width: canvasWidth,
            height: canvasHeight
        };

        return containerInfo;
    }

    function storeOptions(): void {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(options));
    }

    function loadOptions(): void {
        const storedJson = localStorage.getItem(LOCAL_STORAGE_KEY);

        if (storedJson) {
            Object.assign(options, JSON.parse(storedJson));
        }
    }

    function findRequiredElements(): RequiredElements {
        const bottomKeybindings = document.getElementById('bottom-keybindings');
        const editorCanvases = document.getElementById('editor-canvases');

        if (!bottomKeybindings || !bottomKeybindings.parentElement) {
            throw new NotReadyError(`Cannot find the bottom-keybindings element`);
        }

        if (!editorCanvases || !editorCanvases.parentElement) {
            throw new NotReadyError(`Cannot find the editor-canvases element`);
        }

        return { bottomKeybindings, editorCanvases } as RequiredElements;
    }

    class NotReadyError extends Error { }
})();

interface ContainerInfo {
    width: number;
    height: number;
    container: HTMLDivElement;
}

type KnownPatternId = keyof typeof __INKARNATE_GRID_PATTERN_DICT | 'none';

interface GridOptions {
    patternId: KnownPatternId;
    scale: number;
    offsetX: number;
    offsetY: number;
}

interface RequiredElements {
    bottomKeybindings: Existy<Pick<HTMLElement, "parentElement">> & HTMLElement;
    editorCanvases: Existy<Pick<HTMLElement, "parentElement">> & HTMLElement;
}

type Existy<T> = {
    [P in keyof T]-?: Exclude<T[P], null>;
};

