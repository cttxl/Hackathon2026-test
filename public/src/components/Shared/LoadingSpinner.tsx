import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = 'Loading Data...' }: LoadingSpinnerProps) {
  return (
    <div className="loading-spinner-overlay">
      <div className="loading-spinner-content">
        <div className="spinner-core">
          <div className="spinner-ring"></div>
          <div className="spinner-center"></div>
        </div>
        <p className="loading-message">{message}</p>
      </div>
    </div>
  );
}
