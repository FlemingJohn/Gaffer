import { FORMATIONS } from '../data/formations.js';

// Dynamic tactics board: renders a pitch + players positioned from a formation
// definition, plus optional movement arrows. Nothing is hard-coded per formation
// — pass a different `formation` (or your own `positions`) and it re-draws.

const W = 360;
const H = 560;
const M = 16; // margin
const IW = W - 2 * M;
const IH = H - 2 * M;

// normalized (x:0..1 L→R, y:0..1 own-goal→opponent-goal) → pixels (y inverts: attack up)
const px = (x) => M + x * IW;
const py = (y) => H - M - y * IH;

const NODE = {
  gk: { fill: '#f2f5ef', text: '#0b3d2e' },
  def: { fill: '#d8ff3e', text: '#0b3d2e' },
  mid: { fill: '#d8ff3e', text: '#0b3d2e' },
  fwd: { fill: '#e5484d', text: '#ffffff' },
};

function Markings() {
  const s = { stroke: '#f2f5ef', strokeWidth: 2, fill: 'none', opacity: 0.5 };
  return (
    <g {...s}>
      <rect x={M} y={M} width={IW} height={IH} rx="4" />
      <line x1={M} y1={H / 2} x2={W - M} y2={H / 2} />
      <circle cx={W / 2} cy={H / 2} r="42" />
      <circle cx={W / 2} cy={H / 2} r="2.5" fill="#f2f5ef" stroke="none" />
      {/* both penalty + goal boxes */}
      <rect x={W / 2 - 92} y={M} width="184" height="70" />
      <rect x={W / 2 - 46} y={M} width="92" height="28" />
      <rect x={W / 2 - 92} y={H - M - 70} width="184" height="70" />
      <rect x={W / 2 - 46} y={H - M - 28} width="92" height="28" />
    </g>
  );
}

/**
 * @param {object} props
 * @param {string} [props.formation='4-4-2-diamond'] - key into FORMATIONS
 * @param {Record<string,string>} [props.names] - map "role#index" or role → player name
 * @param {Array<{from:number,to:number,label?:string}>} [props.arrows] - indices into positions
 * @param {string} [props.title]
 */
export default function TacticsBoard({ formation = '4-4-2-diamond', names = {}, arrows = [], title }) {
  const positions = FORMATIONS[formation] || FORMATIONS['4-4-2-diamond'];
  const pt = (i) => ({ x: px(positions[i].x), y: py(positions[i].y) });
  // an arrow endpoint may be a position index or a normalized {x,y} point
  const resolve = (t) => (typeof t === 'number' ? pt(t) : { x: px(t.x), y: py(t.y) });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${formation} formation`}>
      <defs>
        <linearGradient id="tb-turf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0e4634" />
          <stop offset="1" stopColor="#0a3327" />
        </linearGradient>
        <marker id="tb-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="#d8ff3e" />
        </marker>
      </defs>

      <rect width={W} height={H} rx="8" fill="url(#tb-turf)" />
      <Markings />

      {/* movement arrows */}
      <g>
        {arrows.map((a, i) => {
          const from = resolve(a.from);
          const to = resolve(a.to);
          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="#d8ff3e"
              strokeWidth="3"
              strokeDasharray="2 6"
              strokeLinecap="round"
              markerEnd="url(#tb-arrow)"
            />
          );
        })}
      </g>

      {/* players */}
      <g fontFamily="'Barlow Condensed','Arial Narrow',sans-serif" fontWeight="800" textAnchor="middle">
        {positions.map((p, i) => {
          const c = NODE[p.line] || NODE.mid;
          const x = px(p.x);
          const y = py(p.y);
          const name = names[`${p.role}#${i}`] || names[p.role];
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="15" fill={c.fill} stroke="#0a3327" strokeWidth="2" />
              <text x={x} y={y + 4} fontSize="12" fill={c.text}>{p.role}</text>
              {name && (
                <text x={x} y={y + 28} fontSize="11" fill="#f2f5ef" fontWeight="600" fontFamily="'Barlow',sans-serif">
                  {name}
                </text>
              )}
            </g>
          );
        })}
      </g>

      {title && (
        <text x={W / 2} y={30} textAnchor="middle" fill="#f2f5ef" fontFamily="'Barlow Condensed',sans-serif" fontWeight="800" fontSize="18" opacity="0.9">
          {title}
        </text>
      )}
    </svg>
  );
}
