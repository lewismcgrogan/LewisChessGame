console.log("ChessGame.tsx loaded", new Date().toISOString());

import { useMemo, useRef, useState } from "react";
import { Chess, Move } from "chess.js";
import { Chessboard } from "react-chessboard";
import MoveList from "./MoveList";
import Toolbar from "./Toolbar";
import { computeStatus, historyPairs } from "../lib/chess";

// Custom piece images (src/images/*.png)
import bishop from "../images/bishop.png";
import king from "../images/king.png";
import knight from "../images/knight.png";
import pawn from "../images/pawn.png";
import queen from "../images/queen.png";
import rook from "../images/rook.png";

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

function pieceShortName(code: string) {
  const type = code[1];
  switch (type) {
    case "P":
      return "Pawn";
    case "N":
      return "Knight";
    case "B":
      return "Bishop";
    case "R":
      return "Rook";
    case "Q":
      return "Queen";
    case "K":
      return "King";
    default:
      return "";
  }
}

export default function ChessGame() {
  const BOARD_WIDTH = 520;
  const SQUARE_SIZE = BOARD_WIDTH / 8;

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

  // Custom pieces
  const whiteFilter = "brightness(1.2) contrast(1.05)";
  const blackFilter = "brightness(0.6) contrast(1.15)";

  const makePiece =
    (pieceCode: string, srcMod: unknown, filter: string) =>
    () => {
      const url = resolveImgUrl(srcMod);
      const label = pieceShortName(pieceCode);

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
          {/* Piece image (back layer) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: url ? `url(${url})` : undefined,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              backgroundSize: "contain",
              filter,
              pointerEvents: "none",
            }}
          />

          {/* Name (front layer) */}
          <div
            style={{
              position: "absolute",
              top: 2,
              left: 0,
              width: "100%",
              textAlign: "center",
              fontSize: 10,
              letterSpacing: 1,
              color: "rgba(255,255,255,0.95)",
              textShadow: "0 1px 2px rgba(0,0,0,0.9)",
              pointerEvents: "none",
              lineHeight: 1,
              zIndex: 2,
            }}
          >
            {label}
          </div>
        </div>
      );
    };

  const customPieces = {
    wP: makePiece("wP", pawn, whiteFilter),
    wR: makePiece("wR", rook, whiteFilter),
    wN: makePiece("wN", knight, whiteFilter),
    wB: makePiece("wB", bishop, whiteFilter),
    wQ: makePiece("wQ", queen, whiteFilter),
    wK: makePiece("wK", king, whiteFilter),

    bP: makePiece("bP", pawn, blackFilter),
    bR: makePiece("bR", rook, blackFilter),
    bN: makePiece("bN", knight, blackFilter),
    bB: makePiece("bB", bishop, blackFilter),
    bQ: makePiece("bQ", queen, blackFilter),
    bK: makePiece("bK", king, blackFilter),
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
