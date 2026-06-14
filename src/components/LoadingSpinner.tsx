export default function LoadingSpinner() {
  return (
    <>
      <div className="spinner-container">
        <div className="spinner" />
      </div>

      <style>{`
        .spinner-container {
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(255, 255, 255, 0.2);
          border-top-color: var(--text);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}
