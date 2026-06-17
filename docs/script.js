let keywords = [];
let isDragging = false;
let dragTarget = null;
let dragCandidate = null;
let offsetX = 0;
let offsetY = 0;
let dragStartX = 0;
let dragStartY = 0;
let justDragged = false;
let selectedBubble = null;
let isDrawing = false;
let drawingContext;
let path = [];
let keywordColorIndex = 0;
let groupColorIndex = 0;
const keywordPaletteColors = ['#9fd4f6', '#f6bea9', '#b9e4b3', '#f1dd8f', '#d8bee6'];
const groupPaletteColors = ['#d8e7e2', '#f1ddd3', '#e5e1d6', '#d9dfef', '#e7ddea'];

function getNextKeywordColor() {
    const color = keywordPaletteColors[keywordColorIndex % keywordPaletteColors.length];
    keywordColorIndex += 1;
    return color;
}

function getNextGroupColor() {
    const color = groupPaletteColors[groupColorIndex % groupPaletteColors.length];
    groupColorIndex += 1;
    return color;
}

async function saveKeyword() {
    const keyword = document.getElementById('keyword').value;
    if (keyword) {
        const now = new Date();
        const data = {
            keyword: keyword,
            date: now.toLocaleDateString(),
            time: now.toLocaleTimeString(),
            x: Math.random() * 90,
            y: Math.random() * 90,
            color: getNextKeywordColor(),
            locked: false
        };

        keywords.push(data);
        document.getElementById('keyword').value = '';
        addKeywordBubble(data, keywords.length - 1);
    }
}

function addKeywordBubble(data, index) {
    const container = document.getElementById('keywordContainer');
    const bubble = document.createElement('div');
    bubble.className = 'keyword-bubble';
    bubble.textContent = data.keyword;
    bubble.style.backgroundColor = data.color;
    setBubbleLocked(bubble, Boolean(data.locked));
    bubble.style.setProperty('--i', index);

    const deleteButton = document.createElement('span');
    deleteButton.className = 'delete-button';
    deleteButton.innerHTML = '&times;';
    deleteButton.addEventListener('click', () => {
        container.removeChild(bubble);
        keywords.splice(index, 1);
    });
    bubble.appendChild(deleteButton);

    bubble.style.top = `${data.y}%`;
    bubble.style.left = `${data.x}%`;

    bubble.addEventListener('mousedown', (e) => {
        if (isBubbleLocked(bubble)) return;
        document.getElementById('colorPalette').style.display = 'none';
        prepareDrag(bubble, e);
    });

    bubble.addEventListener('click', (e) => {
        if (justDragged) {
            justDragged = false;
            return;
        }

        selectedBubble = bubble;
        const colorPalette = renderColorPalette(bubble);
        const bubbleRect = bubble.getBoundingClientRect();
        colorPalette.style.top = `${bubbleRect.bottom + window.scrollY}px`;
        colorPalette.style.left = `${bubbleRect.left + window.scrollX}px`;
        colorPalette.style.display = 'flex';
    });

    attachLockToggle(bubble, (locked) => {
        data.locked = locked;
    });

    container.appendChild(bubble);
}

function renderColorPalette(targetBubble) {
    const colorPalette = document.getElementById('colorPalette');
    const paletteColors = targetBubble && targetBubble.classList.contains('group-bubble')
        ? groupPaletteColors
        : keywordPaletteColors;

    colorPalette.innerHTML = '';
    paletteColors.forEach((color) => {
        const sample = document.createElement('div');
        sample.className = 'color-sample';
        sample.style.backgroundColor = color;
        sample.onclick = () => setColor(color);
        colorPalette.appendChild(sample);
    });

    return colorPalette;
}

function setColor(color) {
    if (selectedBubble) {
        selectedBubble.style.backgroundColor = color;
        const keywordIndex = Array.from(document.getElementById('keywordContainer').children).indexOf(selectedBubble);
        keywords[keywordIndex].color = color;
        selectedBubble = null;
        document.getElementById('colorPalette').style.display = 'none';
    }
}

document.addEventListener('click', (e) => {
    if (selectedBubble && !e.target.classList.contains('keyword-bubble') && !e.target.classList.contains('color-sample')) {
        document.getElementById('colorPalette').style.display = 'none';
        selectedBubble = null;
    }
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging && dragCandidate && (e.buttons & 1)) {
        const movedX = Math.abs(e.clientX - dragStartX);
        const movedY = Math.abs(e.clientY - dragStartY);

        if (movedX > 3 || movedY > 3) {
            isDragging = true;
            dragTarget = dragCandidate;
            dragTarget.style.transition = 'none';
            dragTarget.classList.remove('wall-hit');
            justDragged = true;
        }
    }

    if (isDragging && dragTarget) {
        const container = document.getElementById('keywordContainer');
        const containerRect = container.getBoundingClientRect();
        let x = e.clientX - offsetX - containerRect.left;
        let y = e.clientY - offsetY - containerRect.top;

        const minX = -containerRect.left;
        const minY = -containerRect.top;
        let maxX = window.innerWidth - containerRect.left - dragTarget.clientWidth;
        let maxY = window.innerHeight - containerRect.top - dragTarget.clientHeight;

        if (maxX < minX) maxX = minX;
        if (maxY < minY) maxY = minY;

        if (x < minX) x = minX;
        if (y < minY) y = minY;
        if (x > maxX) x = maxX;
        if (y > maxY) y = maxY;

        dragTarget.style.left = `${x}px`;
        dragTarget.style.top = `${y}px`;
    } else if (isDrawing) {
        path.push({ x: e.clientX, y: e.clientY });
        drawPath();
    }
});

document.addEventListener('mouseup', () => {
    if (isDragging && dragTarget) {
        const container = document.getElementById('keywordContainer');
        const containerRect = container.getBoundingClientRect();
        const bubbleRect = dragTarget.getBoundingClientRect();
        const position = getBubblePositionData(dragTarget, containerRect);

        if (dragTarget.classList.contains('group-bubble')) {
            syncGroupBubbleChildrenPosition(dragTarget, position);
        } else {
            const keywordIndex = Array.from(container.children).indexOf(dragTarget);
            if (keywords[keywordIndex]) {
                keywords[keywordIndex].x = position.x;
                keywords[keywordIndex].y = position.y;
            }
        }

        if (bubbleRect.left <= 0 || bubbleRect.right >= window.innerWidth ||
            bubbleRect.top <= 0 || bubbleRect.bottom >= window.innerHeight) {
            dragTarget.classList.add('wall-hit');
        }

        dragTarget.style.transition = '';
        isDragging = false;
        dragTarget = null;
        dragCandidate = null;
    } else if (isDrawing) {
        isDrawing = false;
        checkPath();
    } else {
        dragCandidate = null;
        justDragged = false;
    }
});

function toggleMenu() {
    const menuContent = document.getElementById('menuContent');
    if (menuContent.style.display === 'block') {
        menuContent.style.display = 'none';
    } else {
        menuContent.style.display = 'block';
    }
}

function openHelp() {
    document.getElementById('menuContent').style.display = 'none';
    const helpModal = document.getElementById('helpModal');
    helpModal.classList.add('is-open');
    helpModal.setAttribute('aria-hidden', 'false');
}

function closeHelp() {
    const helpModal = document.getElementById('helpModal');
    helpModal.classList.remove('is-open');
    helpModal.setAttribute('aria-hidden', 'true');
}

function getBubblePositionData(element, containerRect) {
    const rect = element.getBoundingClientRect();
    return {
        x: ((rect.left - containerRect.left) / containerRect.width) * 100,
        y: ((rect.top - containerRect.top) / containerRect.height) * 100
    };
}

function syncGroupBubbleChildrenPosition(groupBubble, position) {
    const originalBubbles = JSON.parse(groupBubble.dataset.originalBubbles || '[]');
    if (originalBubbles.length === 0) return;

    const minX = Math.min(...originalBubbles.map((bubble) => bubble.x));
    const minY = Math.min(...originalBubbles.map((bubble) => bubble.y));
    const offsetX = position.x - minX;
    const offsetY = position.y - minY;

    const movedBubbles = originalBubbles.map((bubble) => bubble.locked ? bubble : ({
        ...bubble,
        x: bubble.x + offsetX,
        y: bubble.y + offsetY
    }));

    groupBubble.dataset.originalBubbles = JSON.stringify(movedBubbles);
}

function getGroupFrameData(groupBubble, containerRect) {
    const rect = groupBubble.getBoundingClientRect();
    return {
        x: ((rect.left - containerRect.left) / containerRect.width) * 100,
        y: ((rect.top - containerRect.top) / containerRect.height) * 100,
        width: (rect.width / containerRect.width) * 100,
        height: (rect.height / containerRect.height) * 100
    };
}

function getSerializedGroupBubbles(groupBubble, frame) {
    const originalBubbles = JSON.parse(groupBubble.dataset.originalBubbles || '[]');
    if (originalBubbles.length === 0) return [];

    const minX = Math.min(...originalBubbles.map((bubble) => bubble.x));
    const minY = Math.min(...originalBubbles.map((bubble) => bubble.y));
    const offsetX = frame.x - minX;
    const offsetY = frame.y - minY;

    return originalBubbles.map((bubble) => bubble.locked ? bubble : ({
        ...bubble,
        x: bubble.x + offsetX,
        y: bubble.y + offsetY
    }));
}

function serializeBubbleState() {
    const container = document.getElementById('keywordContainer');
    const containerRect = container.getBoundingClientRect();
    const items = Array.from(container.children).map((bubble) => {
        if (bubble.classList.contains('group-bubble')) {
            const frame = getGroupFrameData(bubble, containerRect);
            return {
                type: 'group',
                ...frame,
                color: bubble.style.backgroundColor,
                locked: isBubbleLocked(bubble),
                originalBubbles: getSerializedGroupBubbles(bubble, frame)
            };
        }

        const position = getBubblePositionData(bubble, containerRect);
        return {
            type: 'keyword',
            keyword: getBubbleLabelText(bubble.textContent),
            color: bubble.style.backgroundColor,
            locked: isBubbleLocked(bubble),
            ...position
        };
    });

    return { items };
}

function archiveKeywords() {
    const now = new Date();
    const archiveData = {
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        ...serializeBubbleState(),
    };

    const json = JSON.stringify(archiveData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    a.href = url;
    a.download = `thought-bag_${timestamp}.json`;
    a.click();

    URL.revokeObjectURL(url);
}

function restoreArchiveState(archiveData) {
    const container = document.getElementById('keywordContainer');
    container.innerHTML = '';
    keywords = [];

    const items = archiveData.items || (archiveData.keywords || []).map((data) => ({
        type: 'keyword',
        keyword: data.keyword,
        color: data.color,
        x: data.x,
        y: data.y,
        locked: Boolean(data.locked)
    }));

    items.forEach((item) => {
        if (item.type === 'group') {
            const groupBubble = createGroupBubbleFromData(item);
            container.appendChild(groupBubble);
            return;
        }

        const data = {
            keyword: item.keyword,
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            x: item.x,
            y: item.y,
            color: item.color,
            locked: Boolean(item.locked)
        };
        keywords.push(data);
        addKeywordBubble(data, keywords.length - 1);
    });
}

function loadArchive(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        const archiveData = JSON.parse(content);
        restoreArchiveState(archiveData);
    };
    reader.readAsText(file);
}

function canStartDrawing(target) {
    if (!target) return false;

    const blockedSelector = '.keyword-bubble, .delete-button, .input-container, .menu, .color-palette, input, button';
    if (target.closest(blockedSelector)) {
        return false;
    }

    return Boolean(target.closest('#keywordContainer, #drawCanvas'));
}

function startDrawing(x, y) {
    isDrawing = true;
    path = [{ x, y }];
}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('drawCanvas');
    const helpModal = document.getElementById('helpModal');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawingContext = canvas.getContext('2d');

    document.addEventListener('mousedown', (e) => {
        if (isDragging || isDrawing || !canStartDrawing(e.target)) return;
        startDrawing(e.clientX, e.clientY);
    });

    document.getElementById('keyword').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            saveKeyword();
        }
    });

    helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) {
            closeHelp();
        }
    });
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeHelp();
    }
});

function drawPath() {
    if (!drawingContext) return;
    drawingContext.clearRect(0, 0, drawingContext.canvas.width, drawingContext.canvas.height);
    drawingContext.beginPath();
    drawingContext.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
        drawingContext.lineTo(path[i].x, path[i].y);
    }
    drawingContext.strokeStyle = 'rgba(0, 0, 255, 0.5)';
    drawingContext.lineWidth = 2;
    drawingContext.stroke();
}

function checkPath() {
    if (!drawingContext) return;
    drawingContext.clearRect(0, 0, drawingContext.canvas.width, drawingContext.canvas.height);

    const container = document.getElementById('keywordContainer');
    const containerRect = container.getBoundingClientRect();
    const bubbles = Array.from(container.children);

    const selectedBubbles = bubbles.filter(bubble => {
        const bubbleRect = bubble.getBoundingClientRect();
        const bubbleCenter = {
            x: bubbleRect.left + bubbleRect.width / 2,
            y: bubbleRect.top + bubbleRect.height / 2
        };

        return pointInPolygon(bubbleCenter, path);
    });

    if (selectedBubbles.length > 0) {
        const groupBubble = createGroupBubble(selectedBubbles);
        container.appendChild(groupBubble);
        selectedBubbles.forEach(bubble => container.removeChild(bubble));
    }
}

function pointInPolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;

        const intersect = ((yi > point.y) !== (yj > point.y)) &&
            (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

function getBubbleLabelText(text) {
    return text.replace(/\s*×$/, '');
}

function prepareDrag(target, event) {
    if (isBubbleLocked(target)) return;
    dragCandidate = target;
    offsetX = event.clientX - target.getBoundingClientRect().left;
    offsetY = event.clientY - target.getBoundingClientRect().top;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    justDragged = false;
}

function getFlattenedBubbleData(bubble, containerRect) {
    if (bubble.classList.contains('group-bubble')) {
        return JSON.parse(bubble.dataset.originalBubbles || '[]');
    }

    return [{
        text: getBubbleLabelText(bubble.textContent),
        color: bubble.style.backgroundColor,
        locked: isBubbleLocked(bubble),
        ...getBubblePositionData(bubble, containerRect)
    }];
}

function isBubbleLocked(bubble) {
    return bubble && bubble.dataset.locked === 'true';
}

function setBubbleLocked(bubble, locked) {
    bubble.dataset.locked = locked ? 'true' : 'false';
    bubble.classList.toggle('is-locked', locked);
    bubble.setAttribute('aria-pressed', locked ? 'true' : 'false');
}

function attachLockToggle(bubble, onToggle) {
    bubble.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const locked = !isBubbleLocked(bubble);
        setBubbleLocked(bubble, locked);
        if (locked) {
            bubble.style.transition = '';
        }
        onToggle(locked);

        if (dragCandidate === bubble || dragTarget === bubble) {
            dragCandidate = null;
            dragTarget = null;
            isDragging = false;
        }
    });
}

//　追加分

function populateGroupBubble(groupBubble, originalBubbles) {
    groupBubble.dataset.originalBubbles = JSON.stringify(originalBubbles);

    const deleteButton = document.createElement('span');
    deleteButton.className = 'delete-button';
    deleteButton.innerHTML = '×';
    deleteButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const container = document.getElementById('keywordContainer');
        const savedBubbles = JSON.parse(groupBubble.dataset.originalBubbles || '[]');

        savedBubbles.forEach((bubbleData) => {
            const data = {
                keyword: bubbleData.text,
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString(),
                x: bubbleData.x,
                y: bubbleData.y,
                color: bubbleData.color,
                locked: Boolean(bubbleData.locked)
            };
            keywords.push(data);
            addKeywordBubble(data, keywords.length - 1);
        });

        container.removeChild(groupBubble);
    });
    groupBubble.appendChild(deleteButton);

    originalBubbles.forEach((bubbleData) => {
        const keywordBubble = document.createElement('div');
        keywordBubble.className = 'keyword-bubble';
        keywordBubble.textContent = bubbleData.text;
        keywordBubble.style.backgroundColor = bubbleData.color;
        setBubbleLocked(keywordBubble, Boolean(bubbleData.locked));
        keywordBubble.style.position = 'relative';
        keywordBubble.style.top = '0';
        keywordBubble.style.left = '0';
        keywordBubble.style.margin = `${4 + Math.random() * 6}px`;
        keywordBubble.style.transform = `translate(${Math.random() * 10 - 5}px, ${Math.random() * 8 - 4}px)`;
        keywordBubble.dataset.groupChildIndex = String(groupBubble.children.length - 1);
        attachGroupChildLockToggle(groupBubble, keywordBubble);
        groupBubble.appendChild(keywordBubble);
    });

    setupGroupBubbleEvents(groupBubble);
    return groupBubble;
}

function createGroupBubbleFromData(groupData) {
    const groupBubble = document.createElement('div');
    groupBubble.className = 'keyword-bubble group-bubble';
    groupBubble.style.backgroundColor = groupData.color || getNextGroupColor();
    groupBubble.style.width = `${groupData.width}%`;
    groupBubble.style.height = `${groupData.height}%`;
    groupBubble.style.left = `${groupData.x}%`;
    groupBubble.style.top = `${groupData.y}%`;
    setBubbleLocked(groupBubble, Boolean(groupData.locked));

    return populateGroupBubble(groupBubble, groupData.originalBubbles || []);
}

function createGroupBubble(bubbles) {
    const groupBubble = document.createElement('div');
    groupBubble.className = 'keyword-bubble group-bubble';
    groupBubble.style.backgroundColor = getNextGroupColor();

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    bubbles.forEach(bubble => {
        const rect = bubble.getBoundingClientRect();
        if (rect.left < minX) minX = rect.left;
        if (rect.top < minY) minY = rect.top;
        if (rect.right > maxX) maxX = rect.right;
        if (rect.bottom > maxY) maxY = rect.bottom;
    });

    const containerRect = document.getElementById('keywordContainer').getBoundingClientRect();
    groupBubble.style.width = `${maxX - minX}px`;
    groupBubble.style.height = `${maxY - minY}px`;
    groupBubble.style.left = `${minX - containerRect.left}px`;
    groupBubble.style.top = `${minY - containerRect.top}px`;

    // 元のバブル情報を保存。既存グループは中身をフラットに展開する
    const originalBubbles = bubbles.flatMap((bubble) => getFlattenedBubbleData(bubble, containerRect));
    return populateGroupBubble(groupBubble, originalBubbles);
}

function setupGroupBubbleEvents(groupBubble) {
    groupBubble.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('delete-button')) return;
        const childBubble = e.target.closest('.keyword-bubble');
        if (childBubble && childBubble !== groupBubble && isBubbleLocked(childBubble)) return;
        if (isBubbleLocked(groupBubble)) return;
        prepareDrag(groupBubble, e);
    });

    groupBubble.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-button')) return;
        if (justDragged) {
            justDragged = false;
            return;
        }

        selectedBubble = groupBubble;
        const colorPalette = renderColorPalette(groupBubble);
        const bubbleRect = groupBubble.getBoundingClientRect();
        colorPalette.style.top = `${bubbleRect.bottom + window.scrollY}px`;
        colorPalette.style.left = `${bubbleRect.left + window.scrollX}px`;
        colorPalette.style.display = 'flex';
    });

    attachLockToggle(groupBubble, () => {});
}

function attachGroupChildLockToggle(groupBubble, childBubble) {
    childBubble.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const locked = !isBubbleLocked(childBubble);
        setBubbleLocked(childBubble, locked);

        const childIndex = Number(childBubble.dataset.groupChildIndex);
        const originalBubbles = JSON.parse(groupBubble.dataset.originalBubbles || '[]');
        if (originalBubbles[childIndex]) {
            originalBubbles[childIndex].locked = locked;
            groupBubble.dataset.originalBubbles = JSON.stringify(originalBubbles);
        }
    });
}
