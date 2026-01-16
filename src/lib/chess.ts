import type { Chess, Move } from "chess.js";

export function computeStatus(game: Chess): string {
  if (game.isCheckmate()) return `Checkmate — ${game.turn() === "w" ? "Black" : "White"} wins`;
  if (game.isStalemate()) return "Stalemate";
  if (game.isThreefoldRepetition()) return "Draw — threefold repetition";
  if (game.isInsufficientMaterial()) return "Draw — insufficient material";
  if (game.isDraw()) return "Draw";
  if (game.isCheck()) return `${game.turn() === "w" ? "White" : "Black"} to move — CHECK`;
  return `${game.turn() === "w" ? "White" : "Black"} to move`;
}

export function historyPairs(moves: Move[]): Array<{ white: Move | null; black: Move | null }> {
  const pairs: Array<{ white: Move | null; black: Move | null }> = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({ white: moves[i] ?? null, black: moves[i + 1] ?? null });
  }
  return pairs;
}
