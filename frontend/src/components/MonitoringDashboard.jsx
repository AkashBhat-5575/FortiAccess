import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

function MonitoringDashboard({ architecture, workload }) {
  if (!architecture) return null;

  const baseLatency =
    architecture.id === "C"
      ? 85
      : architecture.id === "B"
      ? 105
      : 130;

  const baseCpu =
    architecture.id === "C"
      ? 42
      : architecture.id === "B"
      ? 55
      : 68;

  const requestRate =
    workload?.traffic_level === "high"
      ? 850
      : workload?.traffic_level === "medium"
      ? 500
      : 220;

  const monitoringData = [
    {
      time: "10:00",
      latency: baseLatency,
      cpu: baseCpu
    },
    {
      time: "10:05",
      latency: baseLatency + 8,
      cpu: baseCpu + 4
    },
    {
      time: "10:10",
      latency: baseLatency - 5,
      cpu: baseCpu - 3
    },
    {
      time: "10:15",
      latency: baseLatency + 12,
      cpu: baseCpu + 7
    },
    {
      time: "10:20",
      latency: baseLatency + 4,
      cpu: baseCpu + 2
    },
    {
      time: "10:25",
      latency: baseLatency - 8,
      cpu: baseCpu - 5
    }
  ];

  const availability =
    architecture.availability_score >= 95
      ? "99.99%"
      : architecture.availability_score >= 90
      ? "99.95%"
      : "99.90%";

  const health =
    architecture.overall_score >= 85
      ? "Healthy"
      : architecture.overall_score >= 70
      ? "Warning"
      : "Critical";

  return (
    <div className="monitoring-dashboard">

      <div className="monitoring-header">
        <div>
          <span className="section-label">
            CLOUD MONITORING
          </span>

          <h2>Performance Dashboard</h2>

          <p>
            Simulated operational metrics for the
            recommended architecture.
          </p>
        </div>

        <div className="health-badge">
          <span className="health-dot"></span>
          {health}
        </div>
      </div>

      <div className="monitoring-metrics">

        <div className="monitor-card">
          <span>CPU Utilization</span>

          <strong>
            {baseCpu}%
          </strong>

          <small>
            Current
          </small>
        </div>

        <div className="monitor-card">
          <span>Request Rate</span>

          <strong>
            {requestRate}
          </strong>

          <small>
            requests/sec
          </small>
        </div>

        <div className="monitor-card">
          <span>Avg Latency</span>

          <strong>
            {baseLatency} ms
          </strong>

          <small>
            Estimated
          </small>
        </div>

        <div className="monitor-card">
          <span>Availability</span>

          <strong>
            {availability}
          </strong>

          <small>
            Estimated
          </small>
        </div>

        <div className="monitor-card">
          <span>Monthly Cost</span>

          <strong>
            $
            {Number(
              architecture.estimated_monthly_cost
            ).toFixed(0)}
          </strong>

          <small>
            Estimated
          </small>
        </div>

      </div>

      <div className="monitor-chart">

        <div className="chart-header">
          <div>
            <h3>
              Performance Trend
            </h3>

            <p>
              CPU utilization and latency over time
            </p>
          </div>
        </div>

        <ResponsiveContainer
          width="100%"
          height={320}
        >
          <LineChart data={monitoringData}>

            <CartesianGrid
              strokeDasharray="3 3"
            />

            <XAxis dataKey="time" />

            <YAxis />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="cpu"
              stroke="#172033"
              strokeWidth={2}
              name="CPU %"
              dot
            />

            <Line
              type="monotone"
              dataKey="latency"
              stroke="#667085"
              strokeWidth={2}
              name="Latency (ms)"
              dot
            />

          </LineChart>
        </ResponsiveContainer>

      </div>

      <div className="monitoring-note">
        <strong>Demo Monitoring Mode</strong>

        <p>
          These metrics are simulated based on the selected
          architecture and workload. Actual AWS CloudWatch
          integration can be added for production monitoring.
        </p>
      </div>

    </div>
  );
}

export default MonitoringDashboard;