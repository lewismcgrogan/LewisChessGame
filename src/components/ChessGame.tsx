console.log("ChessGame.tsx loaded", new Date().toISOString());

import { useMemo, useRef, useState } from "react";
import { Chess, Move } from "chess.js";
import { Chessboard } from "react-chessboard";
import MoveList from "./MoveList";
import Toolbar from "./Toolbar";
import { computeStatus, historyPairs } from "../lib/chess";

// Custom piece images (src/images/*.png) — NEW blue/brown set
import bluebishop from "../images/bluebishop.png";
import blueking from "../images/blueking.png";
import blueknight from "../images/blueknight.png";
import bluepawn from "../images/bluepawn.png";
import bluequeen from "../images/bluequeen.png";
import bluerook from "../images/bluerook.png";

import brownbishop from "../images/brownbishop.png";
import brownking from "../images/brownking.png";
import brownknight from "../images/brownknight.png";
import brownpawn from "../images/brownpawn.png";
import brownqueen from "../images/brownqueen.png";
import brownrook from "../images/brownrook.png";

type Square =
  `${"a" | "b" | "c" | "d" | "e" | "f" | "g" | "h"}${"1" | "2" | "3" | "4" | "5" | "6" | "7" | "8"}`;

function isPromotionMove(game: Chess, from: Square, to: Square) {
  const piece = game.get(from);
  if (!piece || piece.type !== "p") return false;
  const targetRank = to[1];
  return (piece.color === "w" && targetRank === "8") || (piece.color === "b" && targetRank === "1");
}

function resolveImgUrl(mod: unknown): string {
  if (typeof mod === "string") return mod;
  if (mod && typeof mod === "object") {
    const anyMod = mod as any;
    return anyMod.src || anyMod.default || "";
  }
  return "";
}

export default function ChessGame() {
  const BOARD_WIDTH = 520;
  const SQUARE_SIZE = BOARD_WIDTH / 8;

  // Keep ONE Chess instance so undo/history works.
  const gameRef = useRef<Chess>(new Chess());

  const initialFen = useMemo(() => gameRef.current.fen(), []);
  const [fen, setFen] = useState(initialFen);
  const [pgn, setPgn] = useState("");
  const [moves, setMoves] = useState<Move[]>([]);
  const [status, setStatus] = useState("White to move");

  const [selected, setSelected] = useState<Square | null>(null);
  const [legalTargets, setLegalTargets] = useState<Square[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);

  function syncFromGame(g: Chess) {
    setFen(g.fen());
    setPgn(g.pgn());
    setMoves(g.history({ verbose: true }) as Move[]);
    setStatus(computeStatus(g));
  }

  function clearSelection() {
    setSelected(null);
    setLegalTargets([]);
  }

  function selectSquare(square: Square) {
    const g = gameRef.current;
    const piece = g.get(square);

    if (!piece || piece.color !== g.turn()) {
      clearSelection();
      return;
    }

    setSelected(square);
    const targets = g.moves({ square, verbose: true }).map((m: any) => m.to) as Square[];
    setLegalTargets(targets);
  }

  function tryMove(from: Square, to: Square) {
    const g = gameRef.current;

    const move = isPromotionMove(g, from, to)
      ? g.move({ from, to, promotion: "q" })
      : g.move({ from, to });

    if (!move) return false;

    setLastMove({ from, to });
    clearSelection();
    syncFromGame(g);
    return true;
  }

  function onPieceDrop(sourceSquare: any, targetSquare: any) {
    return tryMove(sourceSquare, targetSquare);
  }

  function onSquareClick(square: Square) {
    if (selected) {
      const ok = tryMove(selected, square);
      if (!ok) selectSquare(square);
      return;
    }
    selectSquare(square);
  }

  function onPieceDragBegin(_: string, sourceSquare: Square) {
    selectSquare(sourceSquare);
  }

  function onNewGame() {
    gameRef.current = new Chess();
    setLastMove(null);
    clearSelection();
    syncFromGame(gameRef.current);
  }

  function onUndo() {
    const g = gameRef.current;
    const undone = g.undo();
    if (!undone) return;

    setLastMove(null);
    clearSelection();
    syncFromGame(g);
  }

  async function onCopyPGN() {
    await navigator.clipboard.writeText(pgn);
  }

  // Square styles
  const customSquareStyles: Record<string, React.CSSProperties> = {};

  if (selected) {
    customSquareStyles[selected] = {
      boxShadow: "inset 0 0 0 4px rgba(255,255,255,0.25)",
    };
  }

  // BLACK DOT in the middle for legal targets
  const blackDot = "radial-gradient(circle at center, rgba(0,0,0,0.85) 0 6px, rgba(0,0,0,0) 7px)";

  for (const sq of legalTargets) {
    const existing = customSquareStyles[sq] || {};
    const existingBg = (existing as any).backgroundImage as string | undefined;

    customSquareStyles[sq] = {
      ...existing,
      backgroundImage: existingBg ? `${existingBg}, ${blackDot}` : blackDot,
      backgroundRepeat: "no-repeat",
      backgroundSize: "100% 100%",
    };
  }

  if (lastMove) {
    customSquareStyles[lastMove.from] = {
      ...(customSquareStyles[lastMove.from] || {}),
      backgroundColor: "rgba(255,255,255,0.08)",
    };
    customSquareStyles[lastMove.to] = {
      ...(customSquareStyles[lastMove.to] || {}),
      backgroundColor: "rgba(255,255,255,0.12)",
    };
  }

  // Custom pieces (explicit square size div w/ background image)
  const makePiece =
    (srcMod: unknown) =>
    () => {
      const url = resolveImgUrl(srcMod);

      return (
        <div
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          style={{
            width: SQUARE_SIZE,
            height: SQUARE_SIZE,
            position: "relative",
            pointerEvents: "none",
            userSelect: "none",
            WebkitUserDrag: "none" as any,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: url ? `url(${url})` : undefined,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              backgroundSize: "contain",
              pointerEvents: "none",
            }}
          />
        </div>
      );
    };

  // Map: White = Blue, Black = Brown
  const customPieces = {
    wP: makePiece(bluepawn),
    wR: makePiece(bluerook),
    wN: makePiece(blueknight),
    wB: makePiece(bluebishop),
    wQ: makePiece(bluequeen),
    wK: makePiece(blueking),

    bP: makePiece(brownpawn),
    bR: makePiece(brownrook),
    bN: makePiece(brownknight),
    bB: makePiece(brownbishop),
    bQ: makePiece(brownqueen),
    bK: makePiece(brownking),
  };

  return (
    <div className="card">
      <div className="statusRow">
        <div className="statusText">{status}</div>
        <Toolbar
          onNewGame={onNewGame}
          onUndo={onUndo}
          onCopyPGN={onCopyPGN}
          canUndo={moves.length > 0}
          isGameOver={gameRef.current.isGameOver()}
        />
      </div>

      <div className="layout">
        <div className="boardWrap">
          <Chessboard
            position={fen}
            onPieceDrop={onPieceDrop}
            onSquareClick={onSquareClick}
            onPieceDragBegin={onPieceDragBegin}
            customSquareStyles={customSquareStyles}
            customPieces={customPieces}
            boardWidth={BOARD_WIDTH}
          />
        </div>

        <div className="sidePanel">
          <MoveList pairs={historyPairs(moves)} pgn={pgn} />
        </div>
      </div>
    </div>
  );
}
