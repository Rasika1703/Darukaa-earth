import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useEffect, useState } from "react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
);

type Analytics = {
  recorded_at: string;
  carbon_value: number;
  biodiversity_score: number;
  tree_cover: number;
  co2_sequestered: number;
};

type Site = {
  id: number;
  name: string;
  area_hectares: number;
};

type AnalyticsPanelProps = {
  site: Site;
  token: string;
  onClose: () => void;
};

const API_URL = "http://127.0.0.1:8000";

export default function AnalyticsPanel({
  site,
  token,
  onClose,
}: AnalyticsPanelProps) {
  const [analytics, setAnalytics] = useState<
    Analytics[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/sites/${site.id}/analytics`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load analytics",
          );
        }

        const data = await response.json();
        setAnalytics(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [site.id, token]);

  const latest =
    analytics.length > 0
      ? analytics[analytics.length - 1]
      : null;

  const chartData = {
    labels: analytics.map((item) =>
      new Date(item.recorded_at).getFullYear(),
    ),
   datasets: [
  {
    label: "Carbon value",
    data: analytics.map((item) => item.carbon_value),
    borderColor: "#78c98a",
    backgroundColor: "rgba(120, 201, 138, 0.12)",
    pointBackgroundColor: "#78c98a",
    pointBorderColor: "#78c98a",
    borderWidth: 2,
    tension: 0.35,
    fill: true,
  },
  {
    label: "Biodiversity score",
    data: analytics.map((item) => item.biodiversity_score),
    borderColor: "#60a5fa",
    backgroundColor: "rgba(96, 165, 250, 0.08)",
    pointBackgroundColor: "#60a5fa",
    pointBorderColor: "#60a5fa",
    borderWidth: 2,
    tension: 0.35,
  },
  {
    label: "Tree cover",
    data: analytics.map((item) => item.tree_cover),
    borderColor: "#facc15",
    backgroundColor: "rgba(250, 204, 21, 0.08)",
    pointBackgroundColor: "#facc15",
    pointBorderColor: "#facc15",
    borderWidth: 2,
    tension: 0.35,
  },
],
  };

  return (
    <div className="analytics-overlay">
      <div className="analytics-modal">
        <div className="analytics-header">
          <div>
            <p className="eyebrow">
              SITE PERFORMANCE
            </p>

            <h2>{site.name}</h2>

            <p>
              {site.area_hectares.toFixed(2)} hectares
              · Historical environmental indicators
            </p>
          </div>

          <button
            className="analytics-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="empty">
            Loading analytics...
          </div>
        ) : analytics.length === 0 ? (
          <div className="empty">
            No analytics available.
          </div>
        ) : (
          <>
            <div className="analytics-metrics">
              <div>
                <span>Carbon value</span>
                <strong>
                  {latest?.carbon_value.toLocaleString()}
                </strong>
              </div>

              <div>
                <span>Biodiversity</span>
                <strong>
                  {latest?.biodiversity_score}
                </strong>
              </div>

              <div>
                <span>Tree cover</span>
                <strong>
                  {latest?.tree_cover}%
                </strong>
              </div>

              <div>
                <span>CO₂ sequestered</span>
                <strong>
                  {latest?.co2_sequestered.toLocaleString()}
                </strong>
              </div>
            </div>

            <div className="analytics-chart">
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: {
                    mode: "index",
                    intersect: false,
                  },
                plugins: {
  legend: {
    position: "bottom",
    labels: {
      color: "#b8c9be",
      padding: 18,
    },
  },
},
scales: {
  x: {
    ticks: {
      color: "#82978a",
    },
    grid: {
      color: "rgba(130, 151, 138, 0.08)",
    },
  },
  y: {
    ticks: {
      color: "#82978a",
    },
    grid: {
      color: "rgba(130, 151, 138, 0.08)",
    },
  },
},
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}