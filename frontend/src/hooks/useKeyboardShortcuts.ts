import { useEffect } from 'react';

type ShortcutMap = Record<string, (e: KeyboardEvent) => void>;

/**
 * Register global keyboard shortcuts.
 * Each key is a string like "n", "?", "k" (with optional "cmd+", "ctrl+", "shift+" prefix).
 * Shortcuts are ignored when focus is inside an input, textarea, or select.
 */
export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const inInput = tag === 'input' || tag === 'textarea' || tag === 'select' ||
                      (e.target as HTMLElement)?.isContentEditable;

      for (const [combo, fn] of Object.entries(shortcuts)) {
        const parts = combo.toLowerCase().split('+');
        const key   = parts[parts.length - 1];
        const needCmd   = parts.includes('cmd') || parts.includes('meta');
        const needCtrl  = parts.includes('ctrl');
        const needShift = parts.includes('shift');

        const metaMatch  = !needCmd   || e.metaKey || e.ctrlKey;
        const ctrlMatch  = !needCtrl  || e.ctrlKey;
        const shiftMatch = !needShift || e.shiftKey;
        const keyMatch   = e.key.toLowerCase() === key;

        // For modifier combos allow in inputs, for bare keys skip inputs
        const isModifierCombo = needCmd || needCtrl;
        if (!isModifierCombo && inInput) continue;

        if (keyMatch && metaMatch && ctrlMatch && shiftMatch) {
          fn(e);
          break;
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
}
