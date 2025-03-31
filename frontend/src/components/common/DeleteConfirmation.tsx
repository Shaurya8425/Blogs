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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full">
        <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this item? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={isLoading}
            isLoading={isLoading}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};
