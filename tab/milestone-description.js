const controls = [
    ['bold', 'Bold', '<strong>B</strong>', 'Ctrl+B, Meta+B'],
    ['italic', 'Italic', '<em>I</em>', 'Ctrl+I, Meta+I'],
    ['bullet', 'Bulleted list', '<path d="M9 5h12M9 12h12M9 19h12"/><circle cx="4" cy="5" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="19" r="1"/>'],
    ['ordered', 'Numbered list', '<path d="M10 6h11M10 18h11M3 4l2-1v6M3 13a2 2 0 1 1 3 2l-3 4h4"/>'],
];

export function mountMilestoneDescription(container, record, {label, placeholder}) {
    const box = document.createElement('div');
    box.className = 'milestone-description-editor';
    const toolbar = document.createElement('div');
    toolbar.className = 'milestone-formatting';
    toolbar.setAttribute('role', 'group');
    toolbar.setAttribute('aria-label', 'Description formatting');
    const surface = document.createElement('div');
    box.append(toolbar, surface);
    container.append(box);

    const quill = new window.Quill(surface, {
        formats: ['bold', 'italic', 'list'],
        modules: {toolbar: false, history: {userOnly: true}},
        placeholder,
    });
    const input = quill.root;
    input.setAttribute('role', 'textbox');
    input.setAttribute('aria-label', label);
    input.setAttribute('aria-multiline', 'true');
    if (record.descriptionDelta) quill.setContents(record.descriptionDelta, 'silent');
    else quill.setText(record.description || '', 'silent');
    quill.history.clear();

    let selection = {index: 0, length: 0};
    const buttons = new Map();
    function syncButtons() {
        selection = quill.getSelection() || selection;
        const attrs = quill.getFormat(selection);
        for (const [format, button] of buttons) {
            const active = format === 'bullet' || format === 'ordered' ? attrs.list === format : attrs[format] === true;
            button.setAttribute('aria-pressed', String(active));
        }
    }
    for (const [format, name, graphic, shortcut] of controls) {
        const button = document.createElement('button');
        button.type = 'button';
        button.title = name;
        button.setAttribute('aria-label', name);
        if (shortcut) button.setAttribute('aria-keyshortcuts', shortcut);
        button.innerHTML = graphic.startsWith('<path')
            ? `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${graphic}</svg>`
            : `<span aria-hidden="true">${graphic}</span>`;
        button.addEventListener('pointerdown', event => {
            if (event.pointerType !== 'touch') event.preventDefault();
        });
        button.addEventListener('click', () => {
            quill.setSelection(selection);
            const attrs = quill.getFormat(selection);
            if (format === 'bullet' || format === 'ordered') {
                quill.format('list', attrs.list === format ? false : format, 'user');
            } else {
                quill.format(format, attrs[format] !== true, 'user');
            }
            syncButtons();
        });
        buttons.set(format, button);
        toolbar.append(button);
    }
    quill.on('editor-change', syncButtons);
    syncButtons();
    return {
        input,
        value() {
            const description = quill.getText().replace(/\n$/, '').trim();
            const ops = quill.getContents().ops;
            const formatted = description && ops.some(op => op.attributes?.list || op.attributes?.bold || op.attributes?.italic);
            return {description, descriptionDelta: formatted ? {ops} : null};
        },
        setDisabled(disabled) {
            quill.enable(!disabled);
            buttons.forEach(button => { button.disabled = disabled; });
        },
    };
}

export function renderMilestoneDescription(record, escape, fallback) {
    if (!record.description) return escape(fallback);
    if (!record.descriptionDelta) return escape(record.description);

    const blocks = [];
    let line = '';
    for (const {insert, attributes = {}} of record.descriptionDelta.ops) {
        const pieces = insert.split('\n');
        pieces.forEach((piece, index) => {
            if (piece) {
                let content = escape(piece);
                if (attributes.bold === true) content = `<strong>${content}</strong>`;
                if (attributes.italic === true) content = `<em>${content}</em>`;
                line += content;
            }
            if (index < pieces.length - 1) {
                const list = attributes.list === 'bullet' ? 'ul' : attributes.list === 'ordered' ? 'ol' : null;
                blocks.push({list, content: line || '<br>'});
                line = '';
            }
        });
    }
    if (line) blocks.push({list: null, content: line});
    let html = '', openList = null;
    for (const {list, content} of blocks) {
        if (list !== openList) {
            if (openList) html += `</${openList}>`;
            if (list) html += `<${list}>`;
            openList = list;
        }
        html += list ? `<li>${content}</li>` : `<p>${content}</p>`;
    }
    return html + (openList ? `</${openList}>` : '');
}
