import { useState } from 'react';
import { TopBar, BottomNav } from './components/common.jsx';
import CaptureOverlay from './components/CaptureOverlay.jsx';
import MatchHome from './pages/MatchHome.jsx';
import CardPage from './pages/CardPage.jsx';
import TeamPage from './pages/TeamPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';

export default function App() {
  const [theme, setTheme] = useState('floodlit');
  const [tab, setTab] = useState('match');
  const [view, setView] = useState('home'); // home | card   (within Match tab)
  const [capturing, setCapturing] = useState(false);

  function toggleTheme() {
    const next = theme === 'floodlit' ? 'daylight' : 'floodlit';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  }

  return (
    <div className="stage">
      <div className="phone">
        <TopBar theme={theme} onToggleTheme={toggleTheme} />

        {tab === 'match' && view === 'home' && (
          <MatchHome onRecord={() => setCapturing(true)} />
        )}
        {tab === 'match' && view === 'card' && (
          <CardPage onBack={() => setView('home')} />
        )}
        {tab === 'history' && <HistoryPage />}
        {tab === 'team' && <TeamPage />}

        {capturing && (
          <CaptureOverlay
            onCancel={() => setCapturing(false)}
            onDone={() => {
              setCapturing(false);
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
