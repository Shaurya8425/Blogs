interface ErrorMessageProps {
  message: string;
  className?: string;
}

export const ErrorMessage = ({
  message,
  className = "",
}: ErrorMessageProps) => {
  if (!message) return null;

  return (
    <div
      className={`bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative ${className}`}
      role='alert'
    >
      <span className='block sm:inline'>{message}</span>
    </div>
  );
};
