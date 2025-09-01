export function FriendRequestsPanel({ onClose }) {
    return (
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-gray-900 shadow-2xl z-50 overflow-y-auto p-6 border-l border-gray-600">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Friends</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <p className="text-gray-400 italic">Friend requests content goes here.</p>
      </div>
    );
  }
  