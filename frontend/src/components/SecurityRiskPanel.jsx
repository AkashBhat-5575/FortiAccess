/** @param {{risk: import("../types/domain").SecurityRisk, architecture: import("../types/domain").Architecture}} props */
export default function SecurityRiskPanel({ risk, architecture }) {
  return (
    <>
      <div className="risk-flow">
        User → Identity / role → Device trust → Network / context → Data
        sensitivity → Risk engine → {risk.decision}
      </div>
      <div className="security-grid">
        <div className="security-item">
          <span>Risk score</span>
          <strong>{risk.risk_score} / 100</strong>
        </div>
        <div className="security-item">
          <span>Risk level</span>
          <strong>{risk.risk_level}</strong>
        </div>
        <div className="security-item">
          <span>Advisory decision</span>
          <strong>{risk.decision}</strong>
        </div>
      </div>
      <ul className="risk-factors">
        {risk.factors.map((f) => (
          <li key={f.factor}>
            <strong>
              {f.factor}: +{f.value}
            </strong>
            <span>{f.reason}</span>
          </li>
        ))}
      </ul>
      <p className="fine-print">
        {risk.policy} Identity/device/network inputs are declarations, not
        attestation. Risk is workload/request-level and does not change solely
        because you select another architecture.
      </p>
      <h3>
        {architecture.name} · security posture {architecture.security_score} /
        100
      </h3>
      <ul className="security-controls">
        {architecture.metadata.security_controls.map((c) => (
          <li key={c.service}>
            <strong>{c.service}</strong>
            <p>{c.description}</p>
          </li>
        ))}
      </ul>
      <p className="fine-print">
        These are design assumptions and configuration responsibilities, not
        verified security controls. No WAF, Cognito or CloudTrail deployment is
        claimed.
      </p>
    </>
  );
}
