const options: GridOptions = {
    patternId: 'none',
    scale: 1,
    offsetX: 0,
    offsetY: 0,
};

const LOCAL_STORAGE_KEY = '$$INKARNATE_GRID_OPTIONS';

const PATTERN_DICT = {
    'hex-pointy': {
        width: 387.113671,
        height: 670.5,
        content: `<path d='M 193.556671 223.5 L 387.113671 335.25 L 387.113671 558.75 L 193.556671 670.5 L 0 558.75 M 193.556671 223.5 L 0 335.25 M 193.556671 223.5 L 193.556671 0'/>`,
    },
};

const STROKE_WIDTH = 1;

let containerInfo: ContainerInfo | undefined;

loadOptions();
createUi();
updateGrid();

function createUi() {
    // Pattern type select input
    const select = document.createElement('select');

    for (const key of ['none', ...Object.keys(PATTERN_DICT)]) {
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
    const bottomButton = document.getElementById('bottom-keybindings');

    if (!bottomButton || !bottomButton.parentElement) {
        throw new Error('Cannot find button next to which put the UI');
    }

    bottomButton.parentElement.insertBefore(select, bottomButton);

    bottomButton.parentElement.insertBefore(
        makeRangeInput('0.01', '2', '0.001', 'scale'),
        bottomButton,
    );

    bottomButton.parentElement.insertBefore(
        makeRangeInput('0', '1', '0.01', 'offsetX'),
        bottomButton,
    );

    bottomButton.parentElement.insertBefore(
        makeRangeInput('0', '1', '0.01', 'offsetY'),
        bottomButton,
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
        const pattern = PATTERN_DICT[options.patternId];

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

    const canvasContainer = document.getElementById('editor-canvases');

    if (!canvasContainer) {
        throw new Error('Could not find "editor-canvases" element');
    }

    const canvasWidth = canvasContainer.clientWidth;
    const canvasHeight = canvasContainer.clientHeight;

    const gridSvgContainer = document.createElement('div');

    gridSvgContainer.style.pointerEvents = 'none';
    gridSvgContainer.style.width = `${canvasWidth}px`;
    gridSvgContainer.style.height = `${canvasHeight}px`;
    gridSvgContainer.style.position = 'absolute';

    canvasContainer.appendChild(gridSvgContainer);

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

interface ContainerInfo {
    width: number;
    height: number;
    container: HTMLDivElement;
}

type KnownPatternId = keyof typeof PATTERN_DICT | 'none';

interface GridOptions {
    patternId: KnownPatternId;
    scale: number;
    offsetX: number;
    offsetY: number;
}
