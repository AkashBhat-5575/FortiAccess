const title = (value) => value.charAt(0).toUpperCase() + value.slice(1);
/** @param {{architecture: import("../types/domain").Architecture, result: import("../types/domain").AnalysisResult}} props */
export default function ScoreBreakdown({ architecture, result }) {
  return (
    <section className="explainability">
      <h3>Why this architecture? · Rank {architecture.rank} of 3</h3>
      <p>{result.explanation}</p>
      {architecture.id !== result.recommendation.id && (
        <p>
          You selected {architecture.name}; it trails the recommendation by{" "}
          {(
            result.recommendation.overall_score - architecture.overall_score
          ).toFixed(2)}{" "}
          points.
        </p>
      )}
      <div className="score-list">
        {Object.entries(architecture.metric_scores).map(([metric, score]) => (
          <div className="score-detail" key={metric}>
            <div>
              <strong>
                {title(metric)}: {score.toFixed(2)} / 100
              </strong>
              <span>
                Weight {(architecture.weights[metric] * 100).toFixed(1)}% ·
                contribution {architecture.contributions[metric].toFixed(2)}
              </span>
            </div>
            <progress
              max="100"
              value={score}
              aria-label={`${metric} suitability score`}
            />
            <p>{architecture.metric_reasons[metric]}</p>
          </div>
        ))}
      </div>
      <p>
        <strong>Formula:</strong> overall = Σ(metric score × normalized weight)
        = {architecture.overall_score.toFixed(2)}. Weights total 100%; displayed
        values are rounded. Cost and availability have base weight 3;
        availability weight rises above a 99.9% target. Other weights use your
        priorities.
      </p>
      <p>
        <strong>Strongest scores:</strong>{" "}
        {architecture.strengths.map(title).join(", ")}.{" "}
        <strong>Lower scores:</strong>{" "}
        {architecture.weaknesses.map(title).join(", ")}.
      </p>
      <p>
        <strong>Tradeoffs:</strong> {architecture.metadata.tradeoff}
      </p>
    </section>
  );
}
