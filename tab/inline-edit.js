import {mountMilestoneDescription} from './milestone-description.js?v=roadmap-format-1';

export function createInlineEditing({record, version, save, refresh, redraw, say}) {
    let editing = null;

    function start(target) {
        const milestone = target.closest('[data-mile]');
        if (editing || !milestone || milestone.getAttribute('draggable') === 'false') return;
        const id = milestone.dataset.mile;
        const field = target.dataset.inlineField;
        const item = record(id);
        if (!item || item.archived) return;
        const kind = milestone.dataset.roadmapKind;
        const label = kind === 'milestone' ? 'Milestone' : 'Step';
        document.querySelectorAll('[popover]:popover-open').forEach(popover => popover.hidePopover());

        const holder = document.createElement('div');
        holder.className = 'inline-editor';
        target.replaceWith(holder);
        const rich = field === 'description';
        let input, descriptionEditor;
        if (rich) {
            descriptionEditor = mountMilestoneDescription(holder, item, {
                label: label + ' description',
                placeholder: kind === 'milestone' ? 'What will this milestone mark?' : 'What needs to happen in this step?',
            });
            input = descriptionEditor.input;
        } else {
            input = document.createElement('input');
            input.className = 'milestone-inline-input';
            input.value = item.title || '';
            input.maxLength = 200;
            input.setAttribute('aria-label', label + ' title');
            input.placeholder = `Give this ${kind} a name`;
            holder.append(input);
        }

        const actions = document.createElement('div');
        actions.className = 'inline-actions';
        actions.innerHTML = '<span></span><div><button type="button" class="text-action" data-cancel>Cancel</button><button type="button" class="text-action" data-save>Save</button></div>';
        actions.firstChild.textContent = rich ? 'Ctrl/⌘ + Enter to save · Esc to cancel' : 'Enter to save · Esc to cancel';
        const error = document.createElement('p');
        error.className = 'inline-error';
        error.setAttribute('role', 'alert');
        holder.append(actions, error);
        let versionItem = {...item};
        let expectedVersion = version();
        const value = () => rich ? descriptionEditor.value() : {title: input.value.trim()};
        const initial = JSON.stringify(value());
        editing = {holder, input};
        input.focus();
        if (!rich) input.select();

        function showConflictAction() {
            if (holder.querySelector('[data-refresh-inline]')) return;
            const retry = document.createElement('button');
            retry.type = 'button';
            retry.className = 'text-action';
            retry.dataset.refreshInline = 'true';
            retry.textContent = 'Refresh and keep draft';
            retry.addEventListener('mousedown', event => event.preventDefault());
            retry.onclick = async () => {
                try {
                    await refresh();
                    versionItem = {...record(id)};
                    expectedVersion = version();
                    error.textContent = `Latest ${kind} loaded. Review your text, then save.`;
                    retry.remove();
                    input.focus();
                } catch (err) {
                    error.textContent = err.message;
                }
            };
            actions.append(retry);
        }

        async function finish(cancel = false) {
            if (editing?.holder !== holder || holder.dataset.saving) return;
            const draft = value();
            if (cancel || JSON.stringify(draft) === initial) {
                editing = null;
                holder.replaceWith(target);
                if (cancel) target.focus({preventScroll: true});
                redraw();
                return;
            }
            holder.dataset.saving = 'true';
            if (rich) descriptionEditor.setDisabled(true);
            else input.readOnly = true;
            try {
                await save({...versionItem, ...draft}, expectedVersion);
                editing = null;
                document.querySelector(`[data-mile="${id}"] [data-inline-field="${field}"]`)?.focus({preventScroll: true});
                say(label + ' updated');
            } catch (err) {
                error.textContent = err.message;
                if (rich) descriptionEditor.setDisabled(false);
                else input.readOnly = false;
                input.focus();
                if (err.status === 409) showConflictAction();
            } finally {
                delete holder.dataset.saving;
            }
        }

        holder.addEventListener('keydown', event => {
            if (event.isComposing) return;
            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                finish(true);
            } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey || (!rich && event.target === input))) {
                event.preventDefault();
                event.stopPropagation();
                finish();
            }
        }, true);
        actions.querySelectorAll('button').forEach(button => {
            button.addEventListener('pointerdown', event => event.preventDefault());
            button.addEventListener('click', () => finish(button.hasAttribute('data-cancel')));
        });
        holder.addEventListener('focusout', event => {
            if (!holder.contains(event.relatedTarget)) queueMicrotask(() => {
                if (!holder.contains(document.activeElement)) finish();
            });
        });
        redraw();
    }

    document.addEventListener('dblclick', event => {
        const field = event.target.closest('[data-inline-field]');
        if (field) {
            event.preventDefault();
            start(field);
        }
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Enter' && event.target.matches('[data-inline-field]')) {
            event.preventDefault();
            start(event.target);
        }
    });
    return {active: () => !!editing};
}
