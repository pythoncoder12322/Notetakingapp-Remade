export function WelcomeModal({ onClose }) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-gray-950 to-teal-950 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-black/40 border border-white p-8 rounded-xl shadow-2xl shadow-white/30 max-w-md w-full text-center">
          <h2 className="text-4xl font-extrabold text-stone-100 mb-4">
            Welcome back!
          </h2>
          <p className="text-gray-200 text-lg mb-6">
            This is your personalized space. We're happy to have you here.
          </p>
          <button
            onClick={onClose}
            className="bg-sky-950 hover:bg-sky-700/50 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg hover:shadow-xl transition-all"
          >
            Start Exploring
          </button>
        </div>
      </div>
    );
  }