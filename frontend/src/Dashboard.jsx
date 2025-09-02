"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useLocation } from "react-router-dom";
import { FolderPlus, FilePlus2, Users, LogOut } from "lucide-react";
import './index.css';

import { WelcomeModal } from "./components/dashboard/WelcomeModal";
import { FriendRequestsPanel } from "./components/dashboard/SidePanel";
import { CreateMemoryModal } from "./components/dashboard/CreateFileModal";
import { CreateMemoryTagModal } from "./components/dashboard/CreateFolderModal";
import { RenameFolderModal } from "./components/dashboard/RenameFolderModal";

export default function DashboardPage() {
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [showCreateMemoryModal, setShowCreateMemoryModal] = useState(false);
  const [showCreateMemoryTagModal, setShowCreateMemoryTagModal] = useState(false);
  const [showRenameFolderModal, setShowRenameFolderModal] = useState(false);
  const [renameTag, setRenameTag] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Use useEffect to get the username from the location state when the component mounts
  useEffect(() => {
    if (location.state && location.state.username) {
      setUsername(location.state.username);
    }
  }, [location.state]);

  const openRenameModal = (tag) => {
    setRenameTag(tag);
    setShowRenameFolderModal(true);
  };

  const today = new Date();
  const greeting =
    today.getHours() < 12
      ? "Good Morning"
      : today.getHours() < 18
      ? "Good Afternoon"
      : "Good Evening";

  return (
    <div className="min-h-screen dashboard-background p-6">
        {showFriendRequests && (
          <FriendRequestsPanel onClose={() => setShowFriendRequests(false)} />
        )}
        <div className="max-w-7xl mx-auto backdrop-blur-sm rounded-3xl shadow-lg border-2 border-white/20 p-6 h-full bg-transparent ">
            {/* -------- Modals -------- */}
            {showWelcomeModal && (
                <WelcomeModal onClose={() => setShowWelcomeModal(false)} />
            )}
            
            {showCreateMemoryModal && (
                <CreateMemoryModal onClose={() => setShowCreateMemoryModal(false)} />
            )}
            {showCreateMemoryTagModal && (
                <CreateMemoryTagModal
                    onClose={() => setShowCreateMemoryTagModal(false)}
                />
            )}
            {showRenameFolderModal && (
                <RenameFolderModal
                    onClose={() => setShowRenameFolderModal(false)}
                    tag={renameTag}
                />
            )}

            {/* -------- Header -------- */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl md:text-5xl font-bold text-white">
                    {greeting}
                    {<span className="text-amber-500"> {username}</span>}
                    </h1>
                    <p className="text-stone-400 mt-1 text-lg">
                    {format(today, "EEEE, MMMM d, yyyy")}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                    onClick={() => setShowFriendRequests(true)}
                    className="flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-all duration-200 border-2 border-stone-600 hover:bg-white/10 hover:border-white/30 shadow-md cursor-pointer"
                    >
                    <Users className="w-4 h-4 mr-2" />
                    Friend Requests
                    </button>
                    <button
                    onClick={() => alert("Logout clicked")}
                    className="flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white transition duration-200 shadow-md bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 cursor-pointer"
                    >
                    <LogOut className="w-4 h-4 mr-2" />
                    Log Out
                    </button>
                </div>
            </header>

            {/* -------- Main Layout -------- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Panel: Folders */}
                <aside className="lg:col-span-1 space-y-6">
                    <div className="p-6 rounded-2xl shadow-lg backdrop-blur-md bg-white/10 h-full">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-white">Your Folders</h2>
                        <button
                        onClick={() => setShowCreateMemoryTagModal(true)}
                        className="flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-orange-600 hover:bg-orange-700 text-white shadow-md cursor-pointer duration-200"
                        >
                        <FolderPlus className="w-4 h-4 mr-2" />
                        New
                        </button>
                    </div>
                    <p className="text-stone-300 text-sm italic">
                        No folders yet. Create your first one!
                    </p>
                    </div>
                </aside>

                {/* Right Panel: Files + Shared */}
                <main className="lg:col-span-2 space-y-6">
                    {/* Search + Create */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="relative w-full sm:w-auto">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="w-5 h-5 text-emerald-200"
                            >
                                <path
                                fillRule="evenodd"
                                d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.5 5.564l4.582 4.582a.75.75 0 1 1-1.06 1.06l-4.582-4.582A8.25 8.25 0 0 1 2.25 10.5Z"
                                clipRule="evenodd"
                                />
                            </svg>
                            </div>
                            <input
                                type="text"
                                className="w-full sm:w-auto pl-10 pr-4 py-3 rounded-full bg-white/10 border border-emerald-200 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                                placeholder="Search your memories..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => setShowCreateMemoryModal(true)}
                            className="inline-flex items-center bg-sky-700 px-6 py-3 rounded-full text-white text-base font-bold shadow hover:bg-sky-800 transition cursor-pointer"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="w-5 h-5 mr-2"
                            >
                            <path
                                fillRule="evenodd"
                                d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z"
                                clipRule="evenodd"
                            />
                            </svg>
                            Create Memory
                        </button>
                    </div>

                    {/* Files */}
                    <section className="p-6 rounded-2xl shadow-lg backdrop-blur-md bg-white/10">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-white">Your Files</h2>
                            <button
                                onClick={() => setShowCreateMemoryModal(true)}
                                className="flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer duration-200"
                            >
                                <FilePlus2 className="w-4 h-4 mr-2" />
                                New
                            </button>
                        </div>
                        <p className="text-stone-300 text-sm italic">
                            No files yet. Upload or create one to get started.
                        </p>
                    </section>

                    {/* Shared */}
                    <section className="p-6 rounded-2xl shadow-lg backdrop-blur-md bg-white/10">
                        <h2 className="text-xl font-semibold text-white mb-4">
                            Shared Files
                        </h2>
                        <p className="text-stone-300 text-sm italic">
                            No shared files yet.
                        </p>
                    </section>
                </main>
            </div>
        </div>
    </div>
  );
}