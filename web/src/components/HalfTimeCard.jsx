import { PlayerToken, ConfidenceMeter, severityClass } from './common.jsx';

// Renders the exact HalftimeCard shape from the engine (domain/schema.js).
export default function HalfTimeCard({ card }) {
  return (
    <div className="card">
      <span className="eyebrow">Half-time card</span>
      <h2 className="summary">{card.summary}</h2>

      {card.problems?.length > 0 && (
        <div className="block">
          <span className="eyebrow">What's hurting us</span>
          {card.problems.slice(0, 3).map((p, i) => (
            <div className="problem" key={i}>
              <span className={`chip ${severityClass(p.severity ?? 3)} badge`}>
                <span className="dot" />
              </span>
              <span className="txt">
                <div className="issue">{p.issue}</div>
                {p.evidence && <div className="evidence">“{p.evidence}”</div>}
              </span>
            </div>
          ))}
        </div>
      )}

      {card.adjustments?.length > 0 && (
        <div className="block">
          <span className="eyebrow">Changes to make now</span>
          {card.adjustments.slice(0, 3).map((a, i) => (
            <div className="step" key={i}>
              <span className="num">{i + 1}</span>
              <span>
                <div className="action">{a.action}</div>
                {a.rationale && <div className="why">→ {a.rationale}</div>}
                {a.players?.length > 0 && (
                  <div className="tokens">
                    {a.players.map((p) => (
                      <PlayerToken key={p} name={p} />
                    ))}
                  </div>
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      {card.drill && (
        <div className="block">
          <span className="eyebrow">Next training</span>
          <div className="drill">
            <div className="name">◎ {card.drill.name}</div>
            <div className="desc">{card.drill.description}</div>
          </div>
        </div>
      )}

      <div className="card-foot">
        <span>Grounded in {card.grounding?.length ?? 0} sources</span>
        <ConfidenceMeter value={card.confidence ?? 3} />
      </div>
    </div>
  );
}
