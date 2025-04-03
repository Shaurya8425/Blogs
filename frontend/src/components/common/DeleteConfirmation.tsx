import { Button } from '../ui/button';

interface DeleteConfirmationProps {
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg p-8 max-w-sm w-full shadow-xl animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Delete Post</h2>
          <p className="text-gray-600">
            Are you sure you want to delete this post? This action cannot be undone.
          </p>
        </div>
        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto bg-red-50 text-red-600 hover:bg-red-100 border-red-200 transition-colors"
          >
            {isLoading ? 'Deleting...' : 'Delete Post'}
          </Button>
        </div>
      </div>
    </div>
  );
};
