interface Props { onClose: () => void; }

const SHORTCUTS = [
  { keys: ['⌘', 'K'], description: 'Open global search' },
  { keys: ['N'],       description: 'Create new lead' },
  { keys: ['?'],       description: 'Show keyboard shortcuts' },
];

export default function ShortcutsHelp({ onClose }: Props) {
  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal">
        <div className="modal-header" style={{ alignItems: 'center' }}>
          <h2 id="shortcuts-title" className="modal-title">Keyboard Shortcuts</h2>
        </div>
        <ul className="shortcuts-list">
          {SHORTCUTS.map(({ keys, description }) => (
            <li key={description} className="shortcut-item">
              <span className="shortcut-desc">{description}</span>
              <span className="shortcut-keys">
                {keys.map(k => <kbd key={k} className="kbd">{k}</kbd>)}
              </span>
            </li>
          ))}
        </ul>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
