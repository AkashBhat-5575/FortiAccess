import { useEffect, useState } from "react";
import axios from "axios";
/** @param {{architecture: import("../types/domain").Architecture, apiUrl: string}} props */
export default function TerraformPanel({ architecture, apiUrl }) {
  const [state, setState] = useState(
    /** @type {{loading?: boolean, code?: string, error?: string, copyError?: string}} */ ({
      loading: true,
    }),
  );
  const [copied, setCopied] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true });
    setCopied(false);
    axios
      .get(`${apiUrl}/terraform/${architecture.id}`, {
        signal: controller.signal,
        timeout: 15000,
      })
      .then(({ data }) => setState({ code: data.terraform }))
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({
            error:
              error.response?.data?.detail ||
              "Terraform could not be loaded. Check the API connection.",
          });
      });
    return () => controller.abort();
  }, [architecture.id, apiUrl, retry]);
  function download() {
    const url = URL.createObjectURL(
      new Blob([state.code], { type: "text/plain" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `fortiaccess-${architecture.id}.tf`;
    link.click();
    URL.revokeObjectURL(url);
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(state.code);
      setCopied(true);
    } catch {
      setState((s) => ({
        ...s,
        copyError: "Clipboard unavailable. Use Download Terraform instead.",
      }));
    }
  }
  return (
    <section className="card terraform-panel">
      <span className="section-label">INFRASTRUCTURE AS CODE</span>
      <h2>{architecture.name} · Terraform</h2>
      <p>
        Generated, not deployed. Template defaults are MVP settings, not
        workload-sized provisioning. Adjust capacity after load testing.
        Terraform state contains secrets; use an encrypted restricted remote
        backend.
      </p>
      <p>
        {architecture.id === "C"
          ? "Package the included Lambda example (or your application) as lambda.zip; supply origin_secret. The example reads DynamoDB records and is not end-user authentication."
          : "Supply an existing two-AZ VPC, public/private subnets with outbound access, regional ACM certificate, DNS hosted zone, origin domain, database password and your application bootstrap/image. Compute listens on port 8080 and must expose /health; configure DB TLS."}
      </p>
      {state.loading ? (
        <p role="status">Loading selected architecture template…</p>
      ) : state.error ? (
        <div role="alert">
          {state.error}{" "}
          <button onClick={() => setRetry((n) => n + 1)}>Retry</button>
        </div>
      ) : (
        <>
          <div className="terraform-actions">
            <button className="primary-button" onClick={download}>
              Download Terraform
            </button>
            <button className="secondary-button" onClick={copy}>
              {copied ? "Copied" : "Copy Terraform"}
            </button>
          </div>
          {state.copyError && <p role="alert">{state.copyError}</p>}
          <details>
            <summary>Inspect generated resources</summary>
            <pre>
              <code>{state.code}</code>
            </pre>
          </details>
        </>
      )}
    </section>
  );
}
