import { useEffect, useState } from 'react';
import { TopBar, BottomNav } from './components/common.jsx';
import CaptureOverlay from './components/CaptureOverlay.jsx';
import MatchHome from './pages/MatchHome.jsx';
import CardPage from './pages/CardPage.jsx';
import TeamPage from './pages/TeamPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import { CARD } from './data/sample.js';
import { health, tts } from './lib/api.js';
import { cardToSpeech } from './lib/speech.js';

export default function App() {
  const [theme, setTheme] = useState('floodlit');
  const [tab, setTab] = useState('match');
  const [view, setView] = useState('home'); // home | card (within Match tab)
  const [capturing, setCapturing] = useState(false);
  const [card, setCard] = useState(CARD);
  const [online, setOnline] = useState(false); // is the engine bridge reachable?

  useEffect(() => {
    health().then((h) => setOnline(Boolean(h?.ok)));
  }, []);

  function toggleTheme() {
    const next = theme === 'floodlit' ? 'daylight' : 'floodlit';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  }

  async function speak(c) {
    try {
      const blob = await tts(cardToSpeech(c));
      const audio = new Audio(URL.createObjectURL(blob));
      await audio.play();
    } catch {
      /* bridge offline — read-aloud unavailable */
    }
  }

  return (
    <div className="stage">
      <div className="phone">
        <TopBar theme={theme} onToggleTheme={toggleTheme} />

        {tab === 'match' && view === 'home' && (
          <MatchHome onRecord={() => setCapturing(true)} />
        )}
        {tab === 'match' && view === 'card' && (
          <CardPage card={card} speak={online ? speak : undefined} onBack={() => setView('home')} />
        )}
        {tab === 'history' && <HistoryPage />}
        {tab === 'team' && <TeamPage />}

        {capturing && (
          <CaptureOverlay
            online={online}
            onCancel={() => setCapturing(false)}
            onDone={(resultCard) => {
              setCapturing(false);
              setCard(resultCard || CARD);
              setTab('match');
              setView('card');
            }}
          />
        )}

        <BottomNav
          active={tab}
          onChange={(t) => {
            setTab(t);
            setView('home');
          }}
        />
      </div>
    </div>
  );
}
