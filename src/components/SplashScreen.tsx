import LoadingSpinner from "./LoadingSpinner";

export default function Splashscreen() {
  return (
    <>
      <style>{`
        .splash {
          margin-top: 25%;
          width: 100vw;

          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;

          gap: 16px;

          opacity: 0;
          animation: fadeIn 1.2s ease forwards;
        }

        .splash-logo {
          width: 300px;
          height: 300px;
        }

        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }
      `}</style>

      <div className="splash">
        <img className="splash-logo" src="assets/icon.png" alt="Logo" />
        <LoadingSpinner />
      </div>
    </>
  );
}
