"use strict";

// > Helpers

class EventType {
    static ANIMATIONEND = "animationend";
    static CHANGE = "change";
    static DBLCLICK = "dblclick";
    static KEYDOWN = "keydown";
    static LOAD = "load";
    static MOUSEMOVE = "mousemove";
}

/**
 * @param {string} tagName 
 * @param {object} attributes 
 * @returns {HTMLElement}
 */
const createDom = (tagName, attributes = {}) => {
    const element = document.createElement(tagName);

    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
    });

    return element;
};

/**
 * @template {T}
 * @param {T[]} xs 
 */
const cycle = function* (xs) {
    let i = 0;

    while (true) {
        yield xs[i];
        i = (i + 1) % xs.length;
    }
};

const isFullScreen = () => document.fullscreenElement != null;

/**
 * @param {Node} node
 */
const removeNode = node => node?.parentNode?.removeChild(node);

/**
 * @template T
 * @param {T[]} xs 
 * @returns {T[]}
 */
const shuffle = xs => xs.map(x => ({sort: Math.random(), value: x}))
                        .sort((a, b) => a.sort - b.sort)
                        .map(kv => kv.value);

// < Helpers

class OpenPromise {
    /** @type {Promise} */
    promise;

    /** @type {(value: any) => void} */
    fulfill;

    /** @type {(reason?: any) => void} */
    reject;

    constructor() {
        this.promise = new Promise((fulfill, reject) => {
            this.fulfill = fulfill;
            this.reject = reject;
        });
    }
}

/**
 * - `await`ing on {@link promise} will block until {@link callback} is invoked
 * - {@link callback} invocations reassign {@link promise}
 */
class FulfillingCallback {
    /** @type {OpenPromise} */
    #openPromise;

    /** @type {Promise} */
    get promise() {
        return this.#openPromise.promise;
    }

    /** @type {() => void} */
    callback;

    constructor() {
        this.#openPromise = new OpenPromise();

        this.callback = () => {
            const oldFulfillFn = this.#openPromise.fulfill;
            this.#openPromise = new OpenPromise();
            oldFulfillFn();
        };
    }
}

const body = document.getElementById("js-body");
const input = document.getElementById("js-input");
const inputWrapper = document.getElementById("js-input-wrapper");
const imagesDiv = createDom("div", {"id": "js-images-div"});

const toggleFullscreen = () => {
    if (isFullScreen()) {
        document.exitFullscreen();
    } else {
        body.requestFullscreen();
    }
};

/**
 * @param {KeyboardEvent} event 
 */
const keyHandler = event => {
    const c = event.key.toLocaleUpperCase();

    if (c === "F") {
        toggleFullscreen();
    }
};

const mouseMoveHandler = (() => {
    const noCursor = "no-cursor"
    const hideMouse = () => body.classList.add(noCursor);
    const timeout = () => setTimeout(hideMouse, 1000);

    let state = {
        timeout: timeout(),
        lastPosition: [-1, -1],
    };

    /**
     * @param {MouseEvent} event
     */
    return event => {
        const e = event;
        const nx = e.screenX;
        const ny = e.screenY;
        const [ox, oy] = state.lastPosition;
        const isIdle = ox === nx && oy === ny;

        if (!isIdle) {
            clearTimeout(state.timeout);
            body.classList.remove(noCursor);

            state = {
                timeout: timeout(),
                lastPosition: [nx, ny],
            };
        }
    };
})();

/**
 * @param {File} file 
 * @returns {Promise<string>}
 */
const fileToPromise = file => {
    const openPromise = new OpenPromise();
    const fileReader = new FileReader();

    fileReader.addEventListener(EventType.LOAD, _ => {
        openPromise.fulfill(fileReader.result);
    });
    fileReader.readAsDataURL(file);

    return openPromise.promise;
};

/**
 * @param {File} file
 * @returns {boolean}
 */
const isImage = (() => {
    const re = /^image\//;

    return file => re.test(file.type);
})();

/**
 * @param {string} src 
 * @returns {HTMLElement}
 */
const createSlide = src => createDom("img", {
    class: "slide zero-opacity",
    src: src,
});

/**
 * @param {HTMLElement} parent 
 * @param {File[]} images 
 */
const slideshow = async (parent, images) => {
    const shuffledImages = shuffle(images);
    const imageCycle = cycle(shuffledImages);

    const fulfillingCallback = new FulfillingCallback();
    const animationEndListener = fulfillingCallback.callback;

    let slide = await (async () => {
        let file = imageCycle.next().value;
        let dataUrl = await fileToPromise(file)

        return createSlide(dataUrl);
    })();

    while (true) {
        parent.appendChild(slide);

        slide.addEventListener(EventType.ANIMATIONEND, animationEndListener);
        slide.classList.add("fade-in");
        slide.classList.remove("zero-opacity");

        await fulfillingCallback.promise;

        slide.classList.remove("fade-in");
        slide.classList.add("wait-and-fade-out");

        const file = imageCycle.next().value;
        const dataUrl = await fileToPromise(file);
        const newSlide = createSlide(dataUrl);
        parent.appendChild(newSlide);

        await fulfillingCallback.promise;

        slide.removeEventListener(EventType.ANIMATIONEND, animationEndListener);
        removeNode(slide);

        slide = newSlide;
    };
};

/**
 * @param {Event} _
 */
const inputHandler = _ => {
    const images = Array.from(input.files).filter(isImage);

    if (images.length > 0) {
        removeNode(input);

        inputWrapper.addEventListener(EventType.ANIMATIONEND, _ => {
            removeNode(inputWrapper);
            body.appendChild(imagesDiv);
            slideshow(imagesDiv, images);
        });

        inputWrapper.classList.add("fade-out");
    }
};

const main = () => {
    input.addEventListener(EventType.CHANGE, inputHandler);
    window.addEventListener(EventType.KEYDOWN, keyHandler);
    window.addEventListener(EventType.MOUSEMOVE, mouseMoveHandler);
    window.addEventListener(EventType.DBLCLICK, toggleFullscreen);
};

window.addEventListener(EventType.LOAD, _ => {
    main();
});
