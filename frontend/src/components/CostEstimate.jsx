/** @param {{architecture: import("../types/domain").Architecture}} props */
export default function CostEstimate({ architecture }) {
  const details = architecture.cost_details;
  return (
    <section className="cost-estimate">
      <h3>
        Estimated monthly cost: ${details.total.toFixed(2)} ·{" "}
        {architecture.budget_status}
      </h3>
      <p>
        {details.monthly_requests.toLocaleString()} estimated requests/month
        {details.replicas
          ? ` · ${details.replicas} compute replicas`
          : " · on-demand execution"}
        .
      </p>
      <dl>
        {Object.entries(details.breakdown).map(([name, value]) => (
          <div key={name}>
            <dt>{name}</dt>
            <dd>${value.toFixed(2)}</dd>
          </div>
        ))}
      </dl>
      <details>
        <summary>Estimation assumptions and exclusions</summary>
        <ul>
          {details.assumptions.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
      </details>
    </section>
  );
}
