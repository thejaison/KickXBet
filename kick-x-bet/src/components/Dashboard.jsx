import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../api';

const LEAGUES = [
  { id: 'ALL', name: 'All', icon: '/images/all.png' },
  { id: 'WORLD_CUP', name: 'World Cup', icon: '/images/fifa2026.png' },
  { id: 'PREMIER_LEAGUE', name: 'Premier League', icon: '/images/englishleague.png' },
  { id: 'SERIE_A', name: 'Serie A', icon: '/images/serieA.png' },
  { id: 'BUNDESLIGA', name: 'Bundesliga', icon: '/images/bundesliga.png' },
  { id: 'LALIGA', name: 'LaLiga', icon: '/images/laliga.png' },
  { id: 'CHAMPIONS_LEAGUE', name: 'Champions League', icon: '/images/champions.png' }
];

export default function Dashboard({ user, setUser }) {
  const [balance, setBalance] = useState(user?.balance ?? 500.00);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [betAmount, setBetAmount] = useState('');
  const [showReceipt, setShowReceipt] = useState(null);

  const [myBets, setMyBets] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [newLeague, setNewLeague] = useState('WORLD_CUP');

  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);

  // Admin Form States
  const [newTeamA, setNewTeamA] = useState('');
  const [newTeamB, setNewTeamB] = useState('');
  const [newTeamAImage, setNewTeamAImage] = useState('');
  const [newTeamBImage, setNewTeamBImage] = useState('');
  const [newOddsA, setNewOddsA] = useState('');
  const [newOddsB, setNewOddsB] = useState('');
  const [kickoffTime, setKickoffTime] = useState('');

  // Football Fixtures array state
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/matches`)
      .then(res => res.json())
      .then(data => {
        const sorted = data.sort((a, b) => (a.status === 'LIVE' ? -1 : 1));
        setMatches(sorted);
      })
      .catch(err => console.error("API Fetch Error:", err));

    if (user?.username && !user.isAdmin) {
      fetch(`${API_BASE_URL}/api/users/${user.username}`)
        .then(res => {
          if (!res.ok) throw new Error('Unable to load user data.');
          return res.json();
        })
        .then(userData => {
          setBalance(userData.balance);
          setUser(prev => ({ ...prev, balance: userData.balance }));
        })
        .catch(err => console.error('User Data Fetch Error:', err));

      fetch(`${API_BASE_URL}/api/wagers/user/${user.username}`)
        .then(res => res.json())
        .then(wagerHistory => setMyBets(wagerHistory))
        .catch(err => console.error('Wager History Fetch Error:', err));
    }
  }, [user?.username]);

  // Simulate Live Dynamic Odds Fluctuations for active matches
  useEffect(() => {
    const lifecycleInterval = setInterval(() => {
      setMatches(prevMatches => {
        const rightNow = new Date();

        return prevMatches
          .map(match => {
            if (match.status === 'UPCOMING') {
              const kickoffDate = new Date(match.targetKickoff);
              if (kickoffDate <= rightNow) {
                return { ...match, status: 'LIVE', liveElapsedMinutes: 0 };
              }
              return match;
            }

            if (match.status === 'LIVE') {
              return { ...match, liveElapsedMinutes: match.liveElapsedMinutes + (1 / 60) };
            }

            return match;
          })
          .filter(match => !(match.status === 'LIVE' && match.liveElapsedMinutes >= 100));
      });
    }, 1000);

    return () => clearInterval(lifecycleInterval);
  }, []);

  // Super Admin: Create Match Feature
  const getTotalPool = (match) => (parseFloat(match.totalBetA || 0) + parseFloat(match.totalBetB || 0));

  const getTeamStake = (match, team) => team === match.teamA ? parseFloat(match.totalBetA || 0) : parseFloat(match.totalBetB || 0);

  const getDynamicOdds = (match, team) => {
    const stake = getTeamStake(match, team);
    const pool = getTotalPool(match);
    const fallback = team === match.teamA ? parseFloat(match.oddsA || 1.0) : parseFloat(match.oddsB || 1.0);
    if (stake <= 0 || pool <= stake) return Math.max(1.01, fallback);
    return Math.max(1.01, parseFloat((pool / stake).toFixed(2)));
  };

  const handleTeamImageChange = (e, team) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (team === 'A') setNewTeamAImage(reader.result);
      else setNewTeamBImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateMatch = (e) => {
    e.preventDefault();

    if (!newTeamA || !newTeamB || !newOddsA || !newOddsB || !kickoffTime) return;

    const targetDate = new Date(kickoffTime);
    const now = new Date();

    const newFixture = {
      league: newLeague,
      teamA: newTeamA,
      teamB: newTeamB,
      teamAImage: newTeamAImage,
      teamBImage: newTeamBImage,
      oddsA: parseFloat(newOddsA),
      oddsB: parseFloat(newOddsB),
      totalBetA: 0.0,
      totalBetB: 0.0,
      betCountA: 0,
      betCountB: 0,
      status: targetDate <= now ? 'LIVE' : 'UPCOMING',
      targetKickoff: targetDate.toISOString(),
      liveElapsedMinutes: 0,
      winnerTeam: null,
      votes: 1
    };

    fetch(`${API_BASE_URL}/api/matches?username=${encodeURIComponent(user.username)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFixture)
    })
      .then(res => res.json())
      .then(savedFixture => {
        setMatches([savedFixture, ...matches]);
        setNewTeamA(''); setNewTeamB(''); setNewOddsA(''); setNewOddsB(''); setKickoffTime('');
      })
      .catch(err => alert("Failed to deploy match to database: " + err));
  };

  // Super Admin: Delete Match Feature
  const handleDeleteMatch = (matchId) => {
    fetch(`${API_BASE_URL}/api/matches/${matchId}?username=${encodeURIComponent(user.username)}`, {
      method: 'DELETE'
    })
      .then(() => {
        setMatches(matches.filter(m => m.id !== matchId));
        if (selectedMatch && selectedMatch.id == matchId) {
          setSelectedMatch(null);
        }
      })
      .catch(err => console.error("Failed to delete match record:", err));
  };

  const handleSetMatchWinner = (match, winnerTeam) => {
    fetch(`${API_BASE_URL}/api/matches/${match.id}/winner?username=${encodeURIComponent(user.username)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winnerTeam })
    })
      .then(res => {
        if (!res.ok) throw new Error('Unable to set winning team.');
        return res.json();
      })
      .then(updatedMatch => {
        setMatches(prevMatches => prevMatches.map(m => m.id === updatedMatch.id ? updatedMatch : m));
      })
      .catch(err => {
        console.error('Set winner failed:', err);
        alert('Could not set the winning team.');
      });
  };

  // Corrected parameters to prevent crashes
const handlePlaceBet = (match, team) => {
    const odds = getDynamicOdds(match, team);
    setSelectedMatch({
      ...match,
      selectedTeam: team,
      currentOdds: odds,
      betOn: team === match.teamA ? 'HOME' : 'AWAY'
    });
  };

  const confirmPayment = (e) => {
    e.preventDefault();
    const cost = parseFloat(betAmount);

    if (cost > 0 && cost <= balance) {

      const newBetRecord = {
        matchId: selectedMatch.id,
        teamName: selectedMatch.selectedTeam,
        wager: cost,
        odds: selectedMatch.currentOdds,
        username: user?.username || "Player"
      };

      fetch(`${API_BASE_URL}/api/wagers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBetRecord)
      })
        .then(res => {
          if (!res.ok) throw new Error("Wager server rejection");
          return res.json();
        })
        .then(savedWager => {
          setMyBets(prev => [...prev, savedWager]);

          return fetch(`${API_BASE_URL}/api/users/${user.username}`);
        })
        .then(res => {
          if (!res.ok) throw new Error('Unable to update user balance.');
          return res.json();
        })
        .then(updatedUser => {
          setBalance(updatedUser.balance);
          setUser(prev => ({ ...prev, balance: updatedUser.balance }));
          return fetch(`${API_BASE_URL}/api/matches/${selectedMatch.id}/vote`, {
            method: 'POST'
          });
        })
        .then(res => {
          if (!res.ok) throw new Error("Trending metrics updates failed");
          return res.json();
        })
        .then(updatedMatch => {
          setMatches(prevMatches => prevMatches.map(m => {
            if (m.id !== updatedMatch.id) return m;
            return {
              ...m,
              votes: updatedMatch.votes,
              totalBetA: (parseFloat(m.totalBetA || 0) + (selectedMatch.betOn === 'HOME' ? cost : 0)),
              totalBetB: (parseFloat(m.totalBetB || 0) + (selectedMatch.betOn === 'AWAY' ? cost : 0)),
              betCountA: (parseInt(m.betCountA || 0, 10) + (selectedMatch.betOn === 'HOME' ? 1 : 0)),
              betCountB: (parseInt(m.betCountB || 0, 10) + (selectedMatch.betOn === 'AWAY' ? 1 : 0))
            };
          }));

          setShowReceipt({
            id: 'TXN-' + Math.floor(Math.random() * 900000 + 100000),
            matchDetails: `${selectedMatch.teamA} vs ${selectedMatch.teamB}`,
            team: selectedMatch.selectedTeam,
            wager: cost,
            odds: selectedMatch.currentOdds,
            payout: (cost * selectedMatch.currentOdds).toFixed(2)
          });

          setSelectedMatch(null);
          setBetAmount('');
        })
        .catch(err => {
          console.error("Critical transaction crash intercepted:", err);
          alert("Transaction could not be completed automatically, but screen crash prevented.");
          // Clean fallback to keep UI functional
          setSelectedMatch(null);
          setBetAmount('');
        });
    } else {
      alert("Invalid wager parameters or insufficient balance.");
    }
  };

  const getCountdownText = (targetKickoff) => {
    if (!targetKickoff) return "0.00";

    const kickoffDate = new Date(targetKickoff);
    if (Number.isNaN(kickoffDate.getTime())) return "0.00";

    const difference = kickoffDate - new Date();
    if (difference <= 0) return "0.00";

    const totalSeconds = Math.floor(difference / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const displayMins = mins < 10 ? `0${mins}` : mins;
    const displaySecs = secs < 10 ? `0${secs}` : secs;

    return hours > 0 ? `${hours}:${displayMins}:${displaySecs}` : `${mins}:${displaySecs}`;
  };

  const handleDepositFunds = (e) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);

    if (isNaN(amount) || amount <= 0) return alert("Enter a valid amount.");

    setIsDepositing(true);

    const options = {
      key: "rzp_test_SyeyFnbaXy5jDw",
      amount: amount * 100,
      currency: "INR",
      name: "Kick X Bet",
      description: "Wallet Refill Credit",
      handler: function (response) {
        alert("Payment Captured! ID: " + response.razorpay_payment_id);
        fetch(`${API_BASE_URL}/api/users/${user.username}/deposit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount })
        })
          .then(res => {
            if (!res.ok) throw new Error('Unable to persist deposit.');
            return res.json();
          })
          .then(updatedUser => {
            setBalance(updatedUser.balance);
            setUser(prev => ({ ...prev, balance: updatedUser.balance }));
            setDepositAmount('');
          })
          .catch(err => {
            console.error('Deposit persistence failed:', err);
            alert('Payment captured, but balance update failed. Please reload.');
          })
          .finally(() => setIsDepositing(false));
      },
      modal: { ondismiss: () => setIsDepositing(false) },
      prefill: { name: user?.username || "Player" },
      theme: { color: "#00E676" }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const filteredMatches = activeTab === 'ALL' ? matches : matches.filter(m => m.league === activeTab);
  const maxVotes = Math.max(...matches.map(m => m.votes || 0));

  return (
    <div className="min-h-screen p-6 md:p-12 max-w-6xl mx-auto relative text-white">

      {/* HEADER SECTION */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 glass-panel p-6 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-black tracking-tight">Kick <span className="text-blue-500">X</span> Bets</h2>
          <p className="text-xs text-gray-400">
            {user.isAdmin ? (
              <span className="text-neon-green font-bold tracking-wide uppercase">⚡ Super Admin Session</span>
            ) : (
              <span>Logged in as: <span className="font-mono text-white">{user.username}</span></span>
            )}
          </p>
        </div>

        {/* Right Header Area */}
        <div className="flex items-center gap-4">
          {!user.isAdmin && (
            <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-4">
              <form onSubmit={handleDepositFunds} className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="₹ Amount"
                  className="bg-transparent text-white font-mono text-xs px-2 py-1 w-20 focus:outline-none border border-white/10 rounded-lg"
                />
                <button type="submit" className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs px-3 py-1 rounded-lg border border-emerald-500/30 transition-all">
                  {isDepositing ? "..." : "Add Cash"}
                </button>
              </form>

              <div className="text-right border-l border-white/10 pl-4">
                <span className="block text-[9px] uppercase text-gray-400 tracking-wider">Wallet</span>
                <span className="text-emerald-400 font-bold font-mono text-sm">₹{balance.toFixed(2)}</span>
              </div>
            </div>
          )}
          <button onClick={() => setUser(null)} className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-all">Logout</button>
        </div>
      </header>

      {/* ADMIN CONSOLE VIEW */}
      {user.isAdmin && (
        <section className="glass-panel p-6 rounded-2xl mb-8 border border-emerald-500/20 bg-white/5">
          <h3 className="text-sm font-bold tracking-widest text-emerald-400 uppercase mb-4">Fixture Modification System</h3>
          <form onSubmit={handleCreateMatch} className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
            <div>
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Target League</label>
              <select
                value={newLeague}
                onChange={(e) => setNewLeague(e.target.value)}
                className="w-full bg-neutral-900 border border-white/10 rounded-xl px-2 py-2 text-xs focus:outline-none text-white h-[38px]"
              >
                {LEAGUES.filter(l => l.id !== 'ALL').map(league => (
                  <option key={league.id} value={league.id}>{league.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Team A Name</label>
              <input type="text" value={newTeamA} onChange={(e) => setNewTeamA(e.target.value)} placeholder="e.g. Chelsea" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none text-white" />
              <input type="file" accept="image/png" onChange={(e) => handleTeamImageChange(e, 'A')} className="mt-2 w-full text-xs text-white file:bg-white/10 file:border file:border-white/10 file:px-3 file:py-2 file:rounded-xl" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Team B Name</label>
              <input type="text" value={newTeamB} onChange={(e) => setNewTeamB(e.target.value)} placeholder="e.g. Arsenal" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none text-white" />
              <input type="file" accept="image/png" onChange={(e) => handleTeamImageChange(e, 'B')} className="mt-2 w-full text-xs text-white file:bg-white/10 file:border file:border-white/10 file:px-3 file:py-2 file:rounded-xl" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Odds Team A</label>
              <input type="number" step="0.01" value={newOddsA} onChange={(e) => setNewOddsA(e.target.value)} placeholder="1.85" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none text-white font-mono" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Odds Team B</label>
              <input type="number" step="0.01" value={newOddsB} onChange={(e) => setNewOddsB(e.target.value)} placeholder="2.10" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none text-white font-mono" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Kickoff Target Date & Time</label>
              <input type="datetime-local" value={kickoffTime} onChange={(e) => setKickoffTime(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none text-white font-mono" />
            </div>
            <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 w-full py-2 rounded-xl text-xs font-bold text-black uppercase tracking-wider h-[38px] transition-all">
              Deploy Match
            </button>
          </form>
        </section>
      )}

      {/* DYNAMIC LEAGUE TABS NAVIGATION HEADER */}
      <nav className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-thin border-b border-white/5">
        {LEAGUES.map((league) => (
          <button
            key={league.id}
            onClick={() => { setActiveTab(league.id); setSelectedMatch(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border whitespace-nowrap transition-all duration-200 ${activeTab === league.id
              ? 'bg-white text-black border-white font-bold shadow-lg'
              : 'bg-white/5 hover:bg-white/10 border-white/5 text-gray-400 hover:text-white'
              }`}
          >
            <img
              src={league.icon}
              alt=""
              onError={(e) => { e.target.style.display = 'none'; }}
              className="w-4 h-4 object-contain"
            />
            {league.name}
          </button>
        ))}
      </nav>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs uppercase tracking-widest text-gray-400 font-bold">
            Active Markets: {LEAGUES.find(l => l.id === activeTab)?.name}
          </h3>
          <span className="text-[10px] text-gray-500 font-mono">Count: {filteredMatches.length}</span>
        </div>

        {filteredMatches.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl text-center text-gray-500 text-xs bg-white/5 border border-white/5">
            No active fixtures logged under this league pool option.
          </div>
        ) : (
          filteredMatches.map((match) => {
            const isThisMatchSelected = selectedMatch && selectedMatch.id === match.id;

            return (
              <div key={match.id} className="glass-panel p-5 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-4 transition-all">

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded font-mono animate-pulse">
                      {match.status === 'LIVE' ? 'LIVE' : getCountdownText(match.targetKickoff)}
                    </span>

                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-400 border border-white/5 font-mono">
                      {LEAGUES.find(l => l.id === match.league)?.name}
                    </span>

                    <div className="flex items-center gap-2">
                      {match.teamAImage && <img src={match.teamAImage} alt={match.teamA} className="w-6 h-6 rounded-full object-cover" />}
                      <span className="font-bold text-sm tracking-wide">{match.teamA}</span>
                      <span className="text-gray-600 font-normal">vs</span>
                      {match.teamBImage && <img src={match.teamBImage} alt={match.teamB} className="w-6 h-6 rounded-full object-cover" />}
                      <span className="font-bold text-sm tracking-wide">{match.teamB}</span>
                    </div>
                    {(() => {
                      const isBetPlacedOnA = myBets.some(b => b.matchId === match.id && b.teamName === match.teamA);
                      const isCurrentlySelectedA = isThisMatchSelected && selectedMatch.selectedTeam === match.teamA;
                      const isWinnerA = match.winnerTeam === match.teamA;
                      const highlightTeamA = isBetPlacedOnA || isCurrentlySelectedA || isWinnerA;
                      const dynamicOddsA = getDynamicOdds(match, match.teamA);
                      const winnerClassA = isWinnerA
                        ? 'border border-emerald-300/80 shadow-[0_0_18px_rgba(132,204,22,0.35)] bg-gradient-to-r from-emerald-300/15 via-slate-100/10 to-slate-400/10 animate-pulse text-emerald-50'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-white';

                      return (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handlePlaceBet(match, match.teamA)}
                            disabled={user.isAdmin || match.status !== 'UPCOMING'}
                            className={`flex-1 sm:flex-initial text-xs py-2 px-4 rounded-lg font-mono transition-all duration-300 ${match.status !== 'UPCOMING' && !isBetPlacedOnA ? 'opacity-40 cursor-not-allowed bg-white/5 border-white/5 text-gray-500' : ''} ${highlightTeamA ? 'bg-gradient-to-r from-red-500 via-amber-500 to-yellow-400 bg-[length:200%_200%] animate-gradient-shift text-black font-black border-transparent shadow-lg shadow-amber-500/20' : winnerClassA}`}
                          >
                            {match.teamA} <span className={`ml-1 ${highlightTeamA ? 'text-neutral-900 font-extrabold' : 'text-emerald-400'}`}>@{dynamicOddsA.toFixed(2)}</span>
                            {isBetPlacedOnA && <span className="ml-1.5 text-[9px] uppercase tracking-tighter bg-black/20 text-black px-1 rounded font-black">HELD</span>}
                            {isWinnerA && <span className="ml-1.5 text-[9px] uppercase tracking-tighter bg-emerald-400/15 text-emerald-100 px-1 rounded font-black">WINNER</span>}
                          </button>
                          {user.isAdmin && !match.winnerTeam && (
                            <button
                              onClick={() => handleSetMatchWinner(match, match.teamA)}
                              className="text-emerald-300 hover:text-white text-[10px] px-3 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 transition-all"
                            >
                              Set Winner
                            </button>
                          )}
                        </div>
                      );
                    })()}

                    {(() => {
                      const isBetPlacedOnB = myBets.some(b => b.matchId === match.id && b.teamName === match.teamB);
                      const isCurrentlySelectedB = isThisMatchSelected && selectedMatch.selectedTeam === match.teamB;
                      const isWinnerB = match.winnerTeam === match.teamB;
                      const highlightTeamB = isBetPlacedOnB || isCurrentlySelectedB || isWinnerB;
                      const dynamicOddsB = getDynamicOdds(match, match.teamB);
                      const winnerClassB = isWinnerB
                        ? 'border border-emerald-300/80 shadow-[0_0_18px_rgba(132,204,22,0.35)] bg-gradient-to-r from-emerald-300/15 via-slate-100/10 to-slate-400/10 animate-pulse text-emerald-50'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-white';

                      return (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handlePlaceBet(match, match.teamB)}
                            disabled={user.isAdmin || match.status !== 'UPCOMING'}
                            className={`flex-1 sm:flex-initial text-xs py-2 px-4 rounded-lg font-mono transition-all duration-300 ${match.status !== 'UPCOMING' && !isBetPlacedOnB ? 'opacity-40 cursor-not-allowed bg-white/5 border-white/5 text-gray-500' : ''} ${highlightTeamB ? 'bg-gradient-to-r from-red-500 via-amber-500 to-yellow-400 bg-[length:200%_200%] animate-gradient-shift text-black font-black border-transparent shadow-lg shadow-amber-500/20' : winnerClassB}`}
                          >
                            {match.teamB} <span className={`ml-1 ${highlightTeamB ? 'text-neutral-900 font-extrabold' : 'text-emerald-400'}`}>@{dynamicOddsB.toFixed(2)}</span>
                            {isBetPlacedOnB && <span className="ml-1.5 text-[9px] uppercase tracking-tighter bg-black/20 text-black px-1 rounded font-black">HELD</span>}
                            {isWinnerB && <span className="ml-1.5 text-[9px] uppercase tracking-tighter bg-emerald-400/15 text-emerald-100 px-1 rounded font-black">WINNER</span>}
                          </button>
                          {user.isAdmin && !match.winnerTeam && (
                            <button
                              onClick={() => handleSetMatchWinner(match, match.teamB)}
                              className="text-emerald-300 hover:text-white text-[10px] px-3 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 transition-all"
                            >
                              Set Winner
                            </button>
                          )}
                        </div>
                      );
                    })()}

                    {user.isAdmin && (
                      <button onClick={() => handleDeleteMatch(match.id)} className="bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-400 p-2 rounded-lg text-xs transition-all">✕</button>
                    )}
                  </div>
                </div>

                {isThisMatchSelected && (
                  <div className="border-t border-white/10 pt-4 mt-1 bg-white/[0.02] p-4 rounded-xl border border-white/5 animate-fadeIn">
                    <form onSubmit={confirmPayment} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                      <div className="text-left">
                        <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Position Selected</span>
                        <h4 className="text-sm font-black">{selectedMatch.selectedTeam} to Win <span className="text-gray-400 font-mono text-xs">(@{selectedMatch.currentOdds})</span></h4>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 flex-1 sm:justify-end">
                        <input
                          type="number" required min="1" value={betAmount} onChange={(e) => setBetAmount(e.target.value)}
                          className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/40 font-mono text-xs w-full sm:w-32"
                          placeholder="Stake Amount (₹)"
                        />

                        <div className="bg-black/20 px-4 py-2 rounded-xl border border-white/5 text-xs font-mono flex items-center gap-2">
                          <span className="text-gray-400">Return:</span>
                          <span className="text-emerald-400 font-bold">₹{betAmount ? (parseFloat(betAmount) * selectedMatch.currentOdds).toFixed(2) : '0.00'}</span>
                        </div>

                        <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs py-2 px-5 rounded-xl transition-all uppercase tracking-wide">
                          Place Bet
                        </button>
                        <button type="button" onClick={() => { setSelectedMatch(null); setBetAmount(''); }} className="bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-3 py-2 rounded-xl text-xs transition-all">
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* CONFIRMED RECEIPT MODAL SHEET */}
      {showReceipt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 rounded-2xl w-full max-w-xs text-center border border-emerald-500/20 bg-zinc-900">
            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold">✓</div>
            <h3 className="text-md font-black mb-4">Wager Authorized</h3>
            <div className="text-left space-y-2 border-y border-white/5 py-3 mb-4 text-xs font-light text-gray-300">
              <div className="flex justify-between"><span>Selection:</span> <span className="font-bold text-white">{showReceipt.team}</span></div>
              <div className="flex justify-between"><span>Wager Amount:</span> <span className="font-mono text-white">₹{showReceipt.wager.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Odds Locked:</span> <span className="font-mono text-emerald-400">@{showReceipt.odds}</span></div>
              <div className="flex justify-between border-t border-white/5 pt-2 mt-1"><span className="text-gray-400">Potential Return:</span> <span className="font-mono text-emerald-400 font-bold">₹{showReceipt.payout}</span></div>
            </div>
            <button onClick={() => setShowReceipt(null)} className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded-xl text-xs transition-all">Dismiss</button>
          </div>
        </div>
      )}

    </div>
  );
}