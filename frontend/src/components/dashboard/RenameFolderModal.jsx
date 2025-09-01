export function RenameFolderModal({ onClose, tag }) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl max-w-md w-full text-left">
          <h2 className="text-3xl font-bold text-stone-100 mb-6">
            Rename Folder{tag ? `: "${tag.name}"` : ""}
          </h2>
          <p className="text-gray-300">
            This modal is a placeholder for renaming a folder.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-500 text-gray-200 font-semibold px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
}