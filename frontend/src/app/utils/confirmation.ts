export interface ConfirmOptions {
  title?: string;
  message: string;
  okText?: string;
  cancelText?: string;
}

export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  const { title = 'Please confirm', message, okText = 'Yes', cancelText = 'Cancel' } = options;

  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(15, 23, 24, 0.45)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '9999';
    overlay.style.backdropFilter = 'blur(4px)';

    const box = document.createElement('div');
    box.style.maxWidth = '720px';
    box.style.width = 'min(92%, 720px)';
    box.style.background = '#ffffff';
    box.style.color = '#0b2b2b';
    box.style.borderRadius = '22px';
    box.style.padding = '34px 28px';
    box.style.boxShadow = '0 20px 40px rgba(3, 23, 23, 0.12)';
    box.style.fontFamily = 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial';
    box.style.textAlign = 'center';

    // accessibility ids
    const titleId = `confirm_title_${Date.now()}`;
    const descId = `confirm_desc_${Date.now()}`;
    box.setAttribute('aria-labelledby', titleId);
    box.setAttribute('aria-describedby', descId);

    const iconWrap = document.createElement('div');
    iconWrap.style.width = '88px';
    iconWrap.style.height = '88px';
    iconWrap.style.margin = '0 auto 12px';
    iconWrap.style.borderRadius = '999px';
    iconWrap.style.display = 'flex';
    iconWrap.style.alignItems = 'center';
    iconWrap.style.justifyContent = 'center';
    iconWrap.style.border = '6px solid #dfe7ea';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '96');
    svg.setAttribute('height', '96');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.innerHTML = '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#ffffff" opacity="0"/><path d="M11 16h2v2h-2z" fill="#6b7b83"/><path d="M11 7h2v7h-2z" fill="#6b7b83"/>';

    iconWrap.appendChild(svg);

    const titleEl = document.createElement('h3');
    titleEl.id = titleId;
    titleEl.style.fontSize = '28px';
    titleEl.style.margin = '8px 0 6px';
    titleEl.style.fontWeight = '700';
    titleEl.style.color = '#21343a';
    titleEl.textContent = title;

    const msgEl = document.createElement('p');
    msgEl.id = descId;
    msgEl.style.fontSize = '15px';
    msgEl.style.color = '#546670';
    msgEl.style.margin = '0 auto 20px';
    msgEl.style.maxWidth = '640px';
    msgEl.style.lineHeight = '1.45';
    msgEl.textContent = message;

    const buttons = document.createElement('div');
    buttons.style.display = 'flex';
    buttons.style.justifyContent = 'center';
    buttons.style.gap = '12px';
    buttons.style.marginTop = '6px';

    const primary = document.createElement('button');
    primary.textContent = okText;
    primary.style.background = '#0c969c';
    primary.style.color = '#ffffff';
    primary.style.border = 'none';
    primary.style.padding = '12px 24px';
    primary.style.borderRadius = '999px';
    primary.style.cursor = 'pointer';
    primary.style.fontWeight = '600';
    primary.style.boxShadow = '0 6px 18px rgba(12,150,156,0.18)';

    const secondary = document.createElement('button');
    secondary.textContent = cancelText;
    secondary.style.background = '#ffffff';
    secondary.style.color = '#274d60';
    secondary.style.border = '1px solid #e6eef0';
    secondary.style.padding = '10px 20px';
    secondary.style.borderRadius = '999px';
    secondary.style.cursor = 'pointer';
    secondary.style.fontWeight = '600';

    buttons.appendChild(primary);
    buttons.appendChild(secondary);

    box.appendChild(iconWrap);
    box.appendChild(titleEl);
    box.appendChild(msgEl);
    box.appendChild(buttons);
    overlay.appendChild(box);

    // focus management
    let lastFocus: Element | null = document.activeElement;
    document.body.appendChild(overlay);
    (primary as HTMLButtonElement).focus();

    function cleanup(result: boolean) {
      try {
        overlay.remove();
      } catch (e) {
        /* ignore */
      }
      if (lastFocus && (lastFocus as HTMLElement).focus) {
        try { (lastFocus as HTMLElement).focus(); } catch (e) { /* ignore */ }
      }
      document.removeEventListener('keydown', onKey);
      resolve(result);
    }

    primary.addEventListener('click', () => cleanup(true));
    secondary.addEventListener('click', () => cleanup(false));

    overlay.addEventListener('click', (ev) => {
      if (ev.target === overlay) cleanup(false);
    });

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') cleanup(false);
      if (e.key === 'Enter') cleanup(true);
      if (e.key === 'Tab') {
        // basic focus trap between primary and secondary
        const focusables = [primary, secondary];
        const idx = focusables.indexOf(document.activeElement as HTMLButtonElement);
        if (e.shiftKey) {
          if (idx === 0) { (focusables[focusables.length - 1] as HTMLButtonElement).focus(); e.preventDefault(); }
        } else {
          if (idx === focusables.length - 1) { (focusables[0] as HTMLButtonElement).focus(); e.preventDefault(); }
        }
      }
    }

    document.addEventListener('keydown', onKey);
  });
}

export default confirmDialog;
