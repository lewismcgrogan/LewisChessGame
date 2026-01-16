import ChessGame from "../components/ChessGame";

export default function App() {
  return (
    <div className="page">
      <div className="container">
        <header className="header">
          <div className="titleBlock">
            <h1>Chess</h1>
            <p className="subtitle">React + TypeScript • chess.js • react-chessboard</p>
          </div>
        </header>

        <ChessGame />
      </div>
    </div>
  );
}
