type Props = {
  onNewGame: () => void;
  onUndo: () => void;
  onCopyPGN: () => void;
  canUndo: boolean;
  isGameOver: boolean;
};

export default function Toolbar({ onNewGame, onUndo, onCopyPGN, canUndo }: Props) {
  return (
    <div className="toolbar">
      <button className="btn" onClick={onNewGame}>
        New game
      </button>
      <button className="btn" onClick={onUndo} disabled={!canUndo}>
        Undo
      </button>
      <button className="btn" onClick={onCopyPGN} disabled={!canUndo}>
        Copy PGN
      </button>
    </div>
  );
}
