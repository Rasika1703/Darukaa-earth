import { useState } from "react";

const API_URL = "http://127.0.0.1:8000";

type IntelligenceResponse = {
  product: string;
  conversation_id: string;
  query: string;
  variables: Record<string, any>;
  recommendation: string;
  reasoning: string;
  impacted_metrics: string[];
  time_horizon: string;
  confidence: number;
  relationships: string[];
  evidence: {
    topic: string;
    source: string;
    url: string;
    reason: string;
  }[];
  retrieval_count: number;
};

export default function IntelligencePanel() {
  const [message, setMessage] = useState("");
  const [result, setResult] =
    useState<IntelligenceResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const askTerraNexus = async () => {
    if (!message.trim()) return;

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/intelligence/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
            conversation_id: "terra-demo",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Unable to connect to TerraNexus");
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
      alert(
        "TerraNexus could not connect to the backend."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tn-page">
      <div className="tn-header">
        <div>
          <div className="tn-brand">TerraNexus</div>
          <div className="tn-subtitle">
            AI Biodiversity Intelligence
          </div>
        </div>

        <div className="tn-status">
          <span className="tn-dot" />
          Knowledge system online
        </div>
      </div>

      <div className="tn-intro">
        <h1>Understand your land.</h1>
        <p>
          Connect soil, climate, land-use and biodiversity
          signals to discover evidence-backed interventions.
        </p>
      </div>

      <div className="tn-input-card">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your environmental conditions..."
          rows={5}
        />

        <button
          onClick={askTerraNexus}
          disabled={loading}
        >
          {loading
            ? "Analyzing ecosystem..."
            : "Analyze ecosystem"}
        </button>

        <div className="tn-example">
          Example: Soil organic carbon is 0.3%, rainfall is
          low and wheat is grown continuously.
        </div>
      </div>

      {result && (
        <div className="tn-results">
          <div className="tn-result-main">
            <div className="tn-section-label">
              RECOMMENDATION
            </div>

            <h2>{result.recommendation}</h2>

            <p className="tn-reasoning">
              {result.reasoning}
            </p>

            <div className="tn-metrics">
              <div>
                <span>TIME HORIZON</span>
                <strong>{result.time_horizon}</strong>
              </div>

              <div>
                <span>CONFIDENCE</span>
                <strong>
                  {Math.round(result.confidence * 100)}%
                </strong>
              </div>

              <div>
                <span>KNOWLEDGE RETRIEVED</span>
                <strong>
                  {result.retrieval_count} sources
                </strong>
              </div>
            </div>
          </div>

          <div className="tn-card">
            <div className="tn-section-label">
              IMPACTED METRICS
            </div>

            <div className="tn-tags">
              {result.impacted_metrics.map(
                (metric, index) => (
                  <span key={index}>{metric}</span>
                )
              )}
            </div>
          </div>

          <div className="tn-card">
            <div className="tn-section-label">
              ENVIRONMENTAL RELATIONSHIPS
            </div>

            {result.relationships.map(
              (relationship, index) => (
                <div
                  className="tn-relationship"
                  key={index}
                >
                  <span>→</span>
                  <p>{relationship}</p>
                </div>
              )
            )}
          </div>

          <div className="tn-card">
            <div className="tn-section-label">
              EVIDENCE
            </div>

            {result.evidence.map((item, index) => (
              <div className="tn-evidence" key={index}>
                <div>
                  <strong>{item.topic}</strong>
                  <span>{item.source}</span>
                </div>

                <p>{item.reason}</p>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  View source ↗
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}