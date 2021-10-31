"use strict";
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
    const options = {
        patternId: 'none',
        scale: 1,
        offsetX: 0,
        offsetY: 0,
    };
    const LOCAL_STORAGE_KEY = '$$INKARNATE_GRID_OPTIONS';
    const STROKE_WIDTH = 1;
    let containerInfo;
    onInkarnateReady(() => {
        loadOptions();
        createUi();
        updateGrid();
    });
    function onInkarnateReady(onReady) {
        setTimeout(() => {
            try {
                findRequiredElements();
                onReady();
            }
            catch (e) {
                if (e instanceof NotReadyError) {
                    onInkarnateReady(onReady);
                }
                else {
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
            options.patternId = select.value;
            updateGrid();
        });
        // Put them into footer bar
        const { bottomKeybindings } = findRequiredElements();
        bottomKeybindings.parentElement.insertBefore(select, bottomKeybindings);
        bottomKeybindings.parentElement.insertBefore(makeRangeInput('0.01', '2', '0.001', 'scale'), bottomKeybindings);
        bottomKeybindings.parentElement.insertBefore(makeRangeInput('0', '1', '0.01', 'offsetX'), bottomKeybindings);
        bottomKeybindings.parentElement.insertBefore(makeRangeInput('0', '1', '0.01', 'offsetY'), bottomKeybindings);
    }
    function makeRangeInput(min, max, step, optionKey) {
        const rangeInput = document.createElement('input');
        rangeInput.type = 'range';
        rangeInput.min = min;
        rangeInput.max = max;
        rangeInput.step = step;
        rangeInput.value = `${options[optionKey]}`;
        rangeInput.title = optionKey;
        rangeInput.addEventListener('change', () => {
            options[optionKey] = parseFloat(rangeInput.value);
            updateGrid();
        });
        return rangeInput;
    }
    function updateGrid() {
        storeOptions();
        const { container, width, height } = createGridContainer();
        if (options.patternId === 'none') {
            container.innerHTML = '';
        }
        else {
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
    function createGridContainer() {
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
    function storeOptions() {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(options));
    }
    function loadOptions() {
        const storedJson = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedJson) {
            Object.assign(options, JSON.parse(storedJson));
        }
    }
    function findRequiredElements() {
        const bottomKeybindings = document.getElementById('bottom-keybindings');
        const editorCanvases = document.getElementById('editor-canvases');
        if (!bottomKeybindings || !bottomKeybindings.parentElement) {
            throw new NotReadyError(`Cannot find the bottom-keybindings element`);
        }
        if (!editorCanvases || !editorCanvases.parentElement) {
            throw new NotReadyError(`Cannot find the editor-canvases element`);
        }
        return { bottomKeybindings, editorCanvases };
    }
    class NotReadyError extends Error {
    }
})();
