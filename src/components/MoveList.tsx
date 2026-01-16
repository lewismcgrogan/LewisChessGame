import type { Move } from "chess.js";

type Pair = { white: Move | null; black: Move | null };

export default function MoveList({ pairs, pgn }: { pairs: Pair[]; pgn: string }) {
  return (
    <div className="sideInner">
      <section className="panel">
        <h2>Moves</h2>
        {pairs.length === 0 ? (
          <div className="muted">No moves yet</div>
        ) : (
          <ol className="moves">
            {pairs.map((p, idx) => (
              <li className="moveRow" key={idx}>
                <span className="moveNo">{idx + 1}.</span>
                <span className="moveText">{p.white?.san ?? ""}</span>
                <span className="moveText">{p.black?.san ?? ""}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="panel">
        <h2>PGN</h2>
        <pre className="pgn">{pgn || "—"}</pre>
      </section>
    </div>
  );
}
