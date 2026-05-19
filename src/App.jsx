// src/App.jsx
import React, { useState, useEffect } from 'react';
import LobbyUI from './components/LobbyUI';
import GameCanvas from './components/GameCanvas';
import { setMute } from './utils/audio';
import {
  requestMidgameAd,
  signalGameplayStart,
  signalGameplayStop,
  triggerHappytime,
  saveData,
  loadData
} from './utils/crazyGamesSDK';

function App() {
  const [gameState, setGameState] = useState('menu'); // 'menu' | 'playing' | 'clear'
  const [level, setLevel] = useState(1);
  const [unlockedLevel, setUnlockedLevel] = useState(() => parseInt(loadData('refracto_lvl_unlocked') || '1'));
  const [mute, setMuteState] = useState(() => loadData('refracto_mute') === 'true');
  const [adActive, setAdActive] = useState(false);

  useEffect(() => {
    // Sync mute status
    setMute(mute);
    saveData('refracto_mute', mute);
  }, [mute]);

  const handleLaunchGame = (selectedLevel = 1) => {
    setLevel(selectedLevel);
    setGameState('playing');
    signalGameplayStart();
  };

  const handleLevelClear = () => {
    signalGameplayStop();
    triggerHappytime();

    // Unlock next level
    if (level === unlockedLevel && unlockedLevel < 10) {
      const nextLvl = unlockedLevel + 1;
      setUnlockedLevel(nextLvl);
      saveData('refracto_lvl_unlocked', nextLvl);
    }
    setGameState('clear');
  };

  const handleNextLevel = () => {
    const startNextLevel = () => {
      setLevel(prev => prev + 1);
      setGameState('playing');
      signalGameplayStart();
    };

    if (level >= 10) {
      // Loop back or menu
      setGameState('menu');
      return;
    }

    // Trigger Midgame ad before next level
    setAdActive(true);
    setMute(true); // Mute during ads

    requestMidgameAd({
      adStarted: () => {
        console.log("Ad break started.");
      },
      adFinished: () => {
        setAdActive(false);
        setMute(mute); // restore user mute status
        startNextLevel();
      },
      adError: () => {
        setAdActive(false);
        setMute(mute); // restore user mute status
        startNextLevel();
      }
    });
  };

  const handleQuitGame = () => {
    signalGameplayStop();
    setGameState('menu');
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#030308', position: 'relative', overflow: 'hidden' }}>
      
      {/* 1. Play Screen Viewport */}
      {gameState === 'playing' && !adActive && (
        <div style={{ width: '100%', height: '100%' }}>
          <GameCanvas 
            level={level}
            onLevelClear={handleLevelClear}
            onQuit={handleQuitGame}
          />
        </div>
      )}

      {/* 2. Cockpit Lobby menu */}
      {gameState === 'menu' && !adActive && (
        <LobbyUI 
          unlockedLevel={unlockedLevel}
          onLaunch={handleLaunchGame}
          mute={mute}
          setMute={setMuteState}
        />
      )}

      {/* 3. Level Clear overlay splash */}
      {gameState === 'clear' && !adActive && (
        <div className="screen" style={{ background: 'rgba(3, 3, 11, 0.95)', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '420px', textAlign: 'center' }}>
            <h1 className="neon-title" style={{ fontSize: '28px', color: '#ff007f', textShadow: '0 0 15px rgba(255, 0, 127, 0.5)' }}>
              CORE MATCHED!
            </h1>
            <div className="level-badge" style={{ marginTop: '12px', background: 'rgba(255, 0, 127, 0.1)', borderColor: 'rgba(255, 0, 127, 0.4)', color: '#ff007f' }}>
              SECTOR {level} STABILIZED
            </div>
            
            <p style={{ color: '#b5889e', fontSize: '13px', margin: '20px 0' }}>
              ✦ Optical wavelength vectors successfully aligned with target receptors ✦
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn-cyber" onClick={handleNextLevel}>
                {level >= 10 ? 'FINISH' : 'NEXT SECTOR →'}
              </button>
              <button className="btn-cyber secondary" onClick={() => setGameState('menu')}>
                COCKPIT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Full screen Ad Block Overlay */}
      {adActive && (
        <div className="screen" style={{ background: '#020205', zIndex: 9999 }}>
          <div style={{ textAlign: 'center', fontFamily: 'Orbitron' }}>
            <div className="level-badge" style={{ color: '#ff007f', borderColor: '#ff007f', background: 'rgba(255, 0, 127, 0.1)' }}>TEMPORAL STREAM AD BREAK</div>
            <h2 className="neon-title-cyan" style={{ fontSize: '24px', marginTop: '15px' }}>TRANSMITTING SIGNAL...</h2>
            <p style={{ color: '#775566', fontSize: '12px', marginTop: '10px' }}>Please wait, restoring normal temporal flux shortly.</p>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
