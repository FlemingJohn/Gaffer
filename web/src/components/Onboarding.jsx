import { useState } from 'react';
import { IconBall } from './icons.jsx';
import { useGaffer } from '../lib/store.js';

// First-run: enter your team name. Everything is local — no account, no cloud.
export default function Onboarding() {
  const { team, finishOnboarding } = useGaffer();
  const [name, setName] = useState('');

  function start(e) {
    e.preventDefault();
    if (!name.trim()) return;
    finishOnboarding(name);
  }

  return (
    <div className="overlay onboarding">
      <form className="onboard-card" onSubmit={start}>
        <IconBall width={44} height={44} />
        <h1 className="display" style={{ fontSize: 34 }}>Welcome to Gaffer</h1>
        <p className="onboard-sub">Your offline AI assistant coach. First — what's your team called?</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Riverside U13"
          maxLength={40}
          autoFocus
        />
        <button className="btn btn-primary" type="submit" style={{ width: '100%' }} disabled={!name.trim()}>
          Start
        </button>
        <p className="onboard-note">Nothing leaves your device.</p>
      </form>
    </div>
  );
}
