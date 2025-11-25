// src/components/RocketLaunch.tsx
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';

interface RocketLaunchProps {
  isVisible: boolean;
  onComplete: () => void;
}

export const RocketLaunch: React.FC<RocketLaunchProps> = ({
  isVisible,
  onComplete,
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="pointer-events-none fixed bottom-6 right-6 z-50 flex items-center justify-center"
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{
            opacity: 1,
            // slow at bottom, then accelerate upwards
            y: ['0vh', '-8vh', '-35vh', '-120vh'],
            scale: [0.95, 1, 1, 1],
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 2.2,
            times: [0, 0.2, 0.55, 1],
            ease: 'easeIn',
          }}
          onAnimationComplete={onComplete}
        >
          <div className="relative flex flex-col items-center">
            {/* BIG rocket body (rotated so the nose points straight up) */}
            <motion.div
              className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white shadow-xl shadow-primary/40"
              initial={{ rotate: -45 }} // emoji rotated so its nose is vertical
              animate={{ rotate: [-45, -42, -48, -45] }} // small wobble around vertical
              transition={{ duration: 1.4, ease: 'easeInOut' }}
            >
              <span className="text-5xl">🚀</span>
            </motion.div>

            {/* BIG flame below the rocket */}
            <motion.div
              className="relative mt-2 h-10 w-4 rounded-full bg-gradient-to-b from-yellow-200 via-orange-400 to-red-500 shadow-[0_0_24px_rgba(248,113,113,0.9)]"
              initial={{ scaleY: 0.4, opacity: 0.7 }}
              animate={{
                scaleY: [0.4, 0.7, 1.2],
                opacity: [0.7, 0.9, 1],
              }}
              transition={{
                duration: 1.2,
                ease: 'easeIn',
                times: [0, 0.4, 1],
              }}
            />

            {/* Bigger dust / smoke at the very bottom */}
            <div className="absolute -bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
              <span className="h-5 w-5 rounded-full bg-slate-300/70 blur-[2px] animate-rocket-smoke" />
              <span className="h-4 w-4 rounded-full bg-slate-300/60 blur-[2px] animate-rocket-smoke-delayed" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
