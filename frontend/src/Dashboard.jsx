"use client";

import { useState } from "react";
import { Share2, Download, Trash2, Save, ArrowLeft } from "lucide-react";
import { WelcomeModal } from "./components/dashboard/WelcomeModal";
import { FriendRequestsPanel } from "./components/dashboard/SidePanel";
import { CreateMemoryModal } from "./components/dashboard/CreateFileModal";
import { CreateMemoryTagModal } from "./components/dashboard/CreateFolderModal";
import { RenameFolderModal } from "./components/dashboard/RenameFolderModal";

export default function DashboardPage() {
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [showCreateMemoryModal, setShowCreateMemoryModal] = useState(false);
  const [showCreateMemoryTagModal, setShowCreateMemoryTagModal] = useState(false);
  const [showRenameFolderModal, setShowRenameFolderModal] = useState(false);
  const [renameTag, setRenameTag] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

  const openRenameModal = (tag) => {
    setRenameTag(tag);
    setShowRenameFolderModal(true);
  };

  return (
    <div className="p-6 bg-black min-h-screen text-white font-sans shadow-2xl relative">
      {showWelcomeModal && (
        <WelcomeModal onClose={() => setShowWelcomeModal(false)} />
      )}

      {showFriendRequests && (
        <FriendRequestsPanel onClose={() => setShowFriendRequests(false)} />
      )}

      <header className="flex justify-between items-center mb-10">
        <h1 className="text-5xl font-extrabold drop-shadow-sm">Dashboard</h1>
        <div className="flex space-x-4 items-center">
          <button
            title="Friend Requests"
            className="relative p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-shadow"
            onClick={() => setShowFriendRequests(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={() => alert("Logout clicked")}
            className="bg-red-800 px-5 py-2 rounded font-bold shadow hover:bg-red-900 transition"
          >
            Log Out
          </button>
        </div>
      </header>

      <p className="mb-10 text-xl text-left">
        Capture, organize, and revisit your thoughts.
      </p>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 space-y-4 sm:space-y-0">
        <input
          type="text"
          className="w-full sm:w-auto pl-10 pr-4 py-3 rounded-full bg-white/10 border border-emerald-200 text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-green-800 transition"
          placeholder="Search your memories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled
          aria-label="Search memories"
        />
        <button
          onClick={() => setShowCreateMemoryModal(true)}
          className="inline-flex items-center bg-sky-800 px-6 py-3 rounded-full text-white text-xl font-bold shadow hover:bg-sky-900 transition"
          aria-haspopup="dialog"
          aria-expanded={showCreateMemoryModal}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Create New Memory
        </button>
      </div>

      <section className="mb-10 bg-sky-900/20 p-6 rounded shadow-inner">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Your Folders</h2>
          <button
            onClick={() => setShowCreateMemoryTagModal(true)}
            className="bg-orange-800 px-4 py-2 text-white rounded shadow hover:bg-orange-900 transition"
          >
            Create New Folder
          </button>
        </div>
        <p className="text-center text-gray-300 italic">
          No folders yet! Organize your memories by creating your first folder.
        </p>
      </section>

      <section className="mb-10 bg-emerald-900/20 p-6 rounded shadow-inner">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Your Files</h2>
          <button
            onClick={() => setShowCreateMemoryTagModal(true)}
            className="bg-emerald-800 px-4 py-2 text-white rounded shadow hover:bg-emerald-900 transition"
          >
            Create New File
          </button>
        </div>
        <p className="text-center text-gray-300 italic">
          No files yet! Upload or create files to get started.
        </p>
      </section>

      <section className="mb-10 bg-purple-900/20 p-6 rounded shadow-inner">
        <h2 className="text-2xl font-semibold mb-4">Shared Files</h2>
        <p className="text-center text-gray-300 italic">No shared files yet.</p>
      </section>

      {showCreateMemoryModal && (
        <CreateMemoryModal onClose={() => setShowCreateMemoryModal(false)} />
      )}

      {showCreateMemoryTagModal && (
        <CreateMemoryTagModal onClose={() => setShowCreateMemoryTagModal(false)} />
      )}

      {showRenameFolderModal && (
        <RenameFolderModal
          onClose={() => setShowRenameFolderModal(false)}
          tag={renameTag}
        />
      )}
    </div>
  );
}
