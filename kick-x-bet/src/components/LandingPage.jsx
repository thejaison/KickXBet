import React from "react";

export default function LandingPage({ onGetStarted }) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center select-none">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neonGreen/10 rounded-full blur-[120px] pointer-events-none"></div>
      <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-4">
        Kick <span className="text-brandBlue">X</span> Bet
      </h1>

      <div className="inline-block border border-white/20 px-6 py-2 rounded-full mb-12 bg-black/40 backdrop-blur-md">
        <span className="text-neonGreen font-bold uppercase tracking-wider text-sm mr-2">Smarter Bets.</span>
        <span className="text-brandBlue font-bold uppercase tracking-wider text-sm">Bigger Wins.</span>
      </div>

      <p className="text-gray-400 text-lg md:text-xl max-w-md mb-8 font-light">
        Real insights. Real-time odds. <br />
        <span className="text-neonGreen font-medium">Real results.</span>
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-none justify-center">
        <button
          onClick={onGetStarted}
          className="glass-button-green text-white px-8 py-3 rounded-xl font-bold tracking-wide text-lg shadow-lg"
        >
          Place a Bet
        </button>

        <button className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-8 py-3 rounded-xl font-medium tracking-wide text-lg transition-all">
          Quick Guide
        </button>
      </div>

      <div className="absolute bottom-8 text-center w-full">
        <p className="text-xs uppercase tracking-widest text-gray-500 mb-4">Trusted by Global Football Fans</p>
        <div className="flex justify-center items-center gap-6 opacity-40 grayscale hover:grayscale-0 transition-all">
          <span className="font-bold tracking-wider text-sm">betway</span>
          <span className="font-black italic text-sm">1XBET</span>
          <span className="font-semibold text-sm">UNIBET</span>
          <span className="font-bold text-sm">bet365</span>
        </div>
      </div>
    </div>
  );
}