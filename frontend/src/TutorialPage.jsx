"use client";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket,
  PlusCircle,
  Lock,
  Users,
  BarChart,
  Lightbulb,
} from 'lucide-react';

// --- Starfield Background Component ---
const StarfieldBG = ({ starCount = 160 }) => {
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    const stars = Array.from({ length: starCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.2 + 0.2,
      alpha: Math.random() * 0.6 + 0.4,
      speed: Math.random() * 0.15 + 0.04,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      stars.forEach((s) => {
        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, 2 * Math.PI);
        ctx.fillStyle = "#fff";
        ctx.shadowColor = "#aef";
        ctx.shadowBlur = 7;
        ctx.fill();
        ctx.restore();
        s.y += s.speed;
        if (s.y > height) {
          s.y = 0;
          s.x = Math.random() * width;
        }
      });
      animationFrameId.current = requestAnimationFrame(draw);
    };
    draw();

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      stars.forEach(s => {
        s.x = Math.random() * width;
        s.y = Math.random() * height;
      });
    };
    window.addEventListener("resize", resize);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      window.removeEventListener("resize", resize);
    };
  }, [starCount]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        background:
          "radial-gradient(ellipse at 50% 50%, rgba(5,0,15,0.8) 0%, rgba(0,0,0,1) 75%)",
      }}
      aria-hidden
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100vw", height: "100vh", display: "block" }}
        width={1920}
        height={1080}
      />
      {/* Overlay "neon" nebula gradients */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 3,
          background:
            "radial-gradient(ellipse 500px 250px at 20% 80%, rgba(33, 222, 255, 0.11), transparent 80%)," +
            "radial-gradient(ellipse 700px 300px at 90% 10%, rgba(210, 68, 235, 0.17), transparent 90%)," +
            "radial-gradient(circle 220px at 40% 30%, rgba(100, 255, 100, 0), transparent 86%)",
        }}
      />
    </div>
  );
};

// --- Main Tutorial Components ---
const FeatureSection = ({ feature, isOpen, onToggle, index }) => {
  const headerColors = [
    'from-blue-500/20 to-indigo-600/5',
    'from-purple-500/20 to-pink-600/5',
    'from-emerald-500/20 to-cyan-600/5',
    'from-red-500/20 to-orange-600/5',
    'from-yellow-500/20 to-lime-600/5',
    'from-teal-500/20 to-blue-600/5',
  ];
  const borderColors = [
    'border-blue-600',
    'border-purple-600',
    'border-emerald-600',
    'border-red-600',
    'border-yellow-600',
    'border-teal-600',
  ];
  const shadowColors = [
    'shadow-blue-900/50',
    'shadow-purple-900/50',
    'shadow-emerald-900/50',
    'shadow-red-900/50',
    'shadow-yellow-900/50',
    'shadow-teal-900/50',
  ];

  const currentColorClass = headerColors[index % headerColors.length];
  const currentBorderClass = borderColors[index % borderColors.length];
  const currentShadowClass = shadowColors[index % shadowColors.length];

  return (
    <motion.div
      layout
      data-isopen={isOpen}
      className={`w-full max-w-[70vw] mx-auto border ${currentBorderClass} rounded-3xl overflow-hidden shadow-2xl bg-gray/10 transition-all duration-300
                 hover:${currentBorderClass} hover:${currentShadowClass} data-[isopen=true]:${currentBorderClass} data-[isopen=true]:${currentShadowClass}`}
    >
      <button
        onClick={onToggle}
        className={`w-full text-left !px-8 !py-6 flex items-center justify-between text-white font-semibold text-2xl tracking-tight focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
                    bg-gradient-to-r ${currentColorClass} from-opacity-70 to-opacity-70 via-opacity-70`}
      >
        <span className="flex items-center gap-4">
          <span className="text-white text-3xl transition-transform duration-300 group-hover:scale-110">{feature.icon}</span>
          {feature.title}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-white"
        >
          <PlusCircle size={30} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="!px-8 !pb-8 !pt-4 text-gray-300"
          >
            <p className="mb-6 text-lg leading-relaxed text-gray-300/90">{feature.description}</p>
            <h4 className="text-sm font-bold mb-4 text-cyan-400 uppercase tracking-widest border-b border-gray-700 pb-2">Key Information</h4>
            <ul className="space-y-4 list-disc list-inside text-base marker:text-blue-400">
              {feature.benefits.map((benefit, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                  className="flex items-start"
                >
                  <span className="flex-shrink-0 mr-2">●</span> {benefit}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const FeaturesShowcase = ({ features }) => {
  const [openIndexes, setOpenIndexes] = useState(new Set([0]));
  const toggleIndex = (index) => {
    setOpenIndexes(prev => {
      const newSet = new Set(prev);
      newSet.has(index) ? newSet.delete(index) : newSet.add(index);
      return newSet;
    });
  };
  return (
    <main className="relative min-h-screen text-gray-200 !py-24 !px-6">
      <StarfieldBG />
      <div className="text-center mb-16 relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-6xl font-extrabold tracking-tighter mb-6 leading-tight drop-shadow-2xl bg-clip-text text-transparent bg-gradient-to-r from-teal-300 via-sky-400 to-blue-500"
        >
          Tutorial
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="text-lg max-w-4xl mx-auto text-white mt-8 !px-4"
        >
          Click through each step to learn how to maximize your potential with MemoryVault.
        </motion.p>
      </div>
      <div className="space-y-4 lg:space-y-6 relative z-10">
        {features.map((feature, index) => (
          <FeatureSection
            key={index}
            feature={feature}
            isOpen={openIndexes.has(index)}
            onToggle={() => toggleIndex(index)}
            index={index}
          />
        ))}
      </div>
    </main>
  );
};

export default function TutorialPage() {
  const features = [
    {
      icon: <Rocket />,
      title: "Get Started Instantly",
      description: "Embark on your journey with us by quickly signing up and diving into our intuitive platform.",
      benefits: [
        (
          <span>
            <b>Effortless Onboarding:</b> Log in or create a new account in seconds
          </span>
        ),
        (
          <span>
            <b>Intuitive Dashboard:</b> Explore your personalized dashboard and discover key features
          </span>
        ),
        (
          <span>
            <b>Comprehensive Overview:</b> Navigate through our website, including content, messaging, and more!
          </span>
        ),
      ]
    },
    {
      icon: <Lightbulb />,
      title: "Capture & Organize Memories",
      description: "Build and enrich your personal or collaborative workspace by creating and managing your valuable memories.",
      benefits: [
        (
          <span>
            <b>Rich Text Memories:</b> Craft detailed text files using the TipTap SimpleEditor from MIT
          </span>
        ),
        (
          <span>
            <b>Versatile Uploads:</b> Securely upload videos, images, audio, and various document types
          </span>
        ),
        (
          <span>
            <b>Intelligent Organization:</b> Categorize your memories efficiently with custom MemoryTags.
          </span>
        ),
        (
          <span className="flex items-center">
            <b>Quick Renaming:</b> Easily rename your tags and memories by clicking the
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 rounded-xl bg-sky-300/30" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-7.793 7.793-2.828-2.828L13.586 3.586zM15 7.5l-2.5-2.5L7.5 12.5 10 15l5-5z" />
            </svg>
          </span>
        ),
        (
          <span className="flex items-center">
            <b>Simple Deletion: </b> Remove unwanted tags or memories with a click of the
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 text-red-300" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 11-2 0v6a1 1 0 112 0V8z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        )
      ]
    },
    {
      icon: <Users />,
      title: "Seamless Collaboration",
      description: "Connect and collaborate with your network by managing friends and sharing insights within your workspace.",
      benefits: [
        (
          <span className="flex items-center">
            <b>Effortless Sharing: </b> Share memories and insights with friends by clicking
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
          </span>
        ),
        (
          <span>
            <b>Real-time Messaging:</b> Communicate directly with your friends via the dedicated MemoryMessage page.
          </span>
        ),
      ]
    },
    {
      icon: <Lock />,
      title: "Fortified Data Security",
      description: "Rest assured knowing your valuable data is protected by industry-leading encryption and robust security measures.",
      benefits: [
        (
          <span>
            <b>Advanced Encryption:</b> All data is safeguarded with state-of-the-art encryption protocols
          </span>
        ),
        (
          <span>
            <b>Guaranteed Privacy:</b> Your privacy is our top priority, ensuring your information remains confidential
          </span>
        ),
        (
          <span>
            <b>Regular Security Audits:</b> Continuous audits and updates keep your data secure against emerging threats
          </span>
        ),
      ]
    },
    {
      icon: <BarChart />,
      title: "Insights & Analytics (Coming Soon!)",
      description: "Gain valuable insights into your usage and progress with detailed, intuitive analytics tools.",
      benefits: [
        (
          <span>
            <b>Accurate Usage Tracking:</b> Monitor how you interact with the platform to optimize your workflow
          </span>
        ),
        (
          <span>
            <b>Progress Visualization:</b> See your growth and achievements over time with clear data representation
          </span>
        ),
      ]
    },
    {
      icon: <Lightbulb />,
      title: "Advanced Capabilities (Coming Soon!)",
      description: "Unlock powerful, innovative features designed to significantly enhance your overall experience and productivity.",
      benefits: [
        (
          <span>
            <b>AI-Powered Search:</b> Discover relevant content faster with intelligent search functionalities
          </span>
        ),
        (
          <span>
            <b>Smart Organization:</b> Automate and streamline your memory management with smart suggestions
          </span>
        ),
        (
          <span>
            <b>Cross-Device Synchronization:</b> Access your memories seamlessly across all your devices
          </span>
        ),
        (
          <span>
            <b>Customizable Notifications:</b> Stay informed with personalized alerts and reminders
          </span>
        ),
      ]
    }
  ];
  return <FeaturesShowcase features={features} />;
}
