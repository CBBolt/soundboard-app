import LoadingSpinner from "./LoadingSpinner";
import logo from "/assets/icon.png";

export default function Splashscreen() {
  return (
    <>
      <style>{`
        .splash {
          margin-top: 15%;
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
        <img className="splash-logo" src={logo} alt="Logo" />
        <LoadingSpinner />
      </div>
    </>
  );
}
