const ErrorBanner = ({ message, onClose }) =>
  message ? (
    <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4 flex justify-between items-center">
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="ml-3 text-red-400 hover:text-red-600">✕</button>
      )}
    </div>
  ) : null;

export default ErrorBanner;
