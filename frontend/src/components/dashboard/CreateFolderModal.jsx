export function CreateMemoryTagModal({ onClose }) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 p-8 rounded-xl shadow-lg max-w-md w-full text-left">
          <h2 className="text-3xl font-extrabold text-orange-400 mb-6">
            Create New Folder
          </h2>
          <p className="text-gray-300">
            This modal is a placeholder for creating a new folder.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
}