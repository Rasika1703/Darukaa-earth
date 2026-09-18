import { useEffect, useState, type FormEvent } from "react";
import MapView from "./Components/MapView";
import AnalyticsPanel from "./Components/AnalyticsPanel";

type Project = {
  id: number;
  name: string;
  description: string | null;
  project_type: string;
  status: string;
  created_at: string;
  site_count: number;
};

type Site = {
  id: number;
  name: string;
  description: string | null;
  project_id: number;
  area_hectares: number;
  geometry: GeoJSON.Geometry;
};

const API_URL = "http://127.0.0.1:8000";

type Page = "overview" | "projects" | "sites" | "analytics";

function App() {
  const [activePage, setActivePage] = useState<Page>("overview");

  const [token, setToken] = useState(
    localStorage.getItem("access_token"),
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sitesRefresh, setSitesRefresh] = useState(0);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] =
    useState<Project | null>(null);

  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] =
    useState<Site | null>(null);

  const [analyticsSite, setAnalyticsSite] =
    useState<Site | null>(null);

  const [loading, setLoading] = useState(true);

  const login = async (event: FormEvent) => {
    event.preventDefault();

    setLoginError("");
    setLoginLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setLoginError(
          data.detail || "Invalid email or password",
        );
        return;
      }

      localStorage.setItem(
        "access_token",
        data.access_token,
      );

      setToken(data.access_token);
    } catch (error) {
      console.error(error);

      setLoginError(
        "Cannot connect to the backend server.",
      );
    } finally {
      setLoginLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;

    const loadProjects = async () => {
      setLoading(true);

      try {
        const response = await fetch(
          `${API_URL}/api/projects`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.status === 401) {
          localStorage.removeItem("access_token");
          setToken(null);
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          console.error(data);
          return;
        }

        setProjects(data);

        if (data.length > 0) {
          setSelectedProject(data[0]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [token]);

  useEffect(() => {
    if (!selectedProject || !token) return;

    const loadSites = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/projects/${selectedProject.id}/sites`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.status === 401) {
          localStorage.removeItem("access_token");
          setToken(null);
          return;
        }

        const data = await response.json();

        if (response.ok) {
          setSites(data);
          setSelectedSite(null);
          setAnalyticsSite(null);
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadSites();
}, [selectedProject, token, sitesRefresh]);

  const logout = () => {
    localStorage.removeItem("access_token");

    setToken(null);
    setProjects([]);
    setSites([]);
    setSelectedProject(null);
    setSelectedSite(null);
    setAnalyticsSite(null);
  };
  const createProject = async () => {
  const name = window.prompt("Enter project name:");

  if (!name?.trim()) return;

  const description =
    window.prompt("Enter project description:") || "";

  try {
    const response = await fetch(
      `${API_URL}/api/projects`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description,
          project_type: "Carbon & Biodiversity",
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.detail || "Failed to create project.");
      return;
    }

    setProjects((current) => [...current, data]);
    setSelectedProject(data);
    setActivePage("sites");

    alert(`Project "${data.name}" created successfully.`);
  } catch (error) {
    console.error(error);
    alert("Could not connect to the backend.");
  }
};

  const totalArea = sites.reduce(
    (total, site) =>
      total + site.area_hectares,
    0,
  );

  if (!token) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="brand login-brand">
            <div className="brand-mark">D</div>

            <div>
              <strong>Darukaa</strong>
              <span>.Earth</span>
            </div>
          </div>

          <p className="eyebrow">
            ENVIRONMENTAL INTELLIGENCE
          </p>

          <h1>Welcome back</h1>

          <p className="login-subtitle">
            Sign in to manage carbon and
            biodiversity projects.
          </p>

          <form onSubmit={login}>
            <label>Email</label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="admin@darukaa.earth"
              required
            />

            <label>Password</label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="••••••••"
              required
            />

            {loginError && (
              <div className="login-error">
                {loginError}
              </div>
            )}

            <button
              className="primary-button login-button"
              type="submit"
              disabled={loginLoading}
            >
              {loginLoading
                ? "Signing in..."
                : "Sign in"}
            </button>
          </form>

         <small className="login-demo">
  Demo credentials: admin@darukaa.earth · Darukaa@123
</small>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">D</div>

          <div>
            <strong>Darukaa</strong>
            <span>.Earth</span>
          </div>
        </div>

        <nav>
          <button
            className={`nav-item ${
              activePage === "overview"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("overview")
            }
          >
            <span>◈</span>
            Overview
          </button>

          <button
            className={`nav-item ${
              activePage === "projects"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("projects")
            }
          >
            <span>⌂</span>
            Projects
          </button>

          <button
            className={`nav-item ${
              activePage === "sites"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("sites")
            }
          >
            <span>⌖</span>
            Sites
          </button>

          <button
            className={`nav-item ${
              activePage === "analytics"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("analytics")
            }
          >
            <span>◒</span>
            Analytics
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="user-card">
            <div className="avatar">DA</div>

            <div>
              <strong>Darukaa Admin</strong>
              <span>Administrator</span>
            </div>
          </div>

          <button
            className="logout"
            onClick={logout}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="main">

        {/* PROJECTS PAGE */}
        {activePage === "projects" && (
          <section className="panel page-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">
                  PROJECT MANAGEMENT
                </p>

                <h1>Projects</h1>

                <p>
                  Manage environmental monitoring
                  programs.
                </p>
              </div>

             <button
  className="primary-button"
  onClick={createProject}
>
  + New project
</button>
            </div>

            <div className="project-list">
              {projects.map((project) => (
                <button
                  key={project.id}
                  className="project-card"
                  onClick={() => {
                    setSelectedProject(project);
                    setActivePage("sites");
                  }}
                >
                  <div className="project-icon">
                    ✦
                  </div>

                  <div className="project-info">
                    <strong>
                      {project.name}
                    </strong>

                    <span>
                      {project.project_type}
                    </span>
                  </div>

                  <div className="project-meta">
                    <strong>
                      {project.site_count}
                    </strong>

                    <span>sites</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* SITES PAGE */}
        {activePage === "sites" && (
          <section className="panel page-panel">
            <div className="panel-header">
  <div>
    <p className="eyebrow">
      GEOSPATIAL MONITORING
    </p>

    <h1>Monitoring Sites</h1>

    <p>
      {selectedProject?.name ||
        "Select a project"}
    </p>
  </div>

  <select
    className="project-selector"
    value={selectedProject?.id ?? ""}
    onChange={(event) => {
      const project = projects.find(
        (item) =>
          item.id === Number(event.target.value),
      );

      if (project) {
        setSelectedProject(project);
        setSelectedSite(null);
        setAnalyticsSite(null);
      }
    }}
  >
    <option value="" disabled>
      Select project
    </option>

    {projects.map((project) => (
      <option
        key={project.id}
        value={project.id}
      >
        {project.name}
      </option>
    ))}
  </select>
</div>

            <div className="map-container page-map">
              <MapView
  sites={sites}
  projectId={selectedProject?.id}
  token={token}
  onSiteCreated={() =>
    setSitesRefresh((value) => value + 1)
  }
  onSiteClick={(site) => {
                  setSelectedSite(site);
                  setAnalyticsSite(site);
                  setActivePage("analytics");
                }}
              />
            </div>
          </section>
        )}

        {/* ANALYTICS PAGE */}
        {activePage === "analytics" && (
          <section className="panel page-panel">
            {selectedSite ? (
              <AnalyticsPanel
                site={selectedSite}
                token={token}
                onClose={() =>
                  setActivePage("sites")
                }
              />
            ) : (
              <div className="empty">
                Select a monitoring site to view
                analytics.
              </div>
            )}
          </section>
        )}

        {/* OVERVIEW PAGE */}
        {activePage === "overview" && (
          <>
            <header
              className="topbar"
              id="overview-section"
            >
              <div>
                <p className="eyebrow">
                  ENVIRONMENTAL INTELLIGENCE
                </p>

                <h1>Project overview</h1>
              </div>

             <button
  className="primary-button"
  onClick={createProject}
>
  + New project
</button>
            </header>

            <section className="metrics">
              <div className="metric-card">
                <span>Total projects</span>

                <strong>
                  {projects.length}
                </strong>

                <small>
                  Active monitoring programs
                </small>
              </div>

              <div className="metric-card">
                <span>Monitoring sites</span>

                <strong>
                  {sites.length}
                </strong>

                <small>
                  Geographical areas tracked
                </small>
              </div>

              <div className="metric-card">
                <span>Total area</span>

                <strong>
                  {totalArea.toFixed(1)} ha
                </strong>

                <small>
                  Across selected project
                </small>
              </div>

              <div className="metric-card highlight">
                <span>System status</span>

                <strong>Healthy</strong>

                <small>
                  Data services operational
                </small>
              </div>
            </section>

            <section
              className="content-grid"
              id="projects-section"
            >
              <div className="panel projects-panel">
                <div className="panel-header">
                  <div>
                    <h2>Projects</h2>

                    <p>
                      Carbon and biodiversity
                      programs
                    </p>
                  </div>
                </div>

                {loading ? (
                  <div className="empty">
                    Loading projects...
                  </div>
                ) : (
                  <div className="project-list">
                    {projects.map((project) => (
                      <button
                        key={project.id}
                        className={`project-card ${
                          selectedProject?.id ===
                          project.id
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          setSelectedProject(
                            project,
                          )
                        }
                      >
                        <div className="project-icon">
                          ✦
                        </div>

                        <div className="project-info">
                          <strong>
                            {project.name}
                          </strong>

                          <span>
                            {project.project_type}
                          </span>
                        </div>

                        <div className="project-meta">
                          <strong>
                            {project.site_count}
                          </strong>

                          <span>sites</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="panel map-panel">
                <div className="panel-header">
                  <div>
                    <h2>
                      Geographical coverage
                    </h2>

                    <p>
                      {selectedProject
                        ? selectedProject.name
                        : "Select a project"}
                    </p>
                  </div>

                  <span className="map-status">
                    ● Live data
                  </span>
                </div>

                <div className="map-container">
                  <MapView
  sites={sites}
  projectId={selectedProject?.id}
  token={token}
  onSiteCreated={() =>
    setSitesRefresh((value) => value + 1)
  }
  onSiteClick={(site) => {
                      setSelectedSite(site);
                      setAnalyticsSite(site);
                      setActivePage("analytics");
                    }}
                  />
                </div>
              </div>
            </section>

            <section
              className="panel sites-panel"
              id="sites-section"
            >
              <div className="panel-header">
                <div>
                  <h2>Monitoring sites</h2>

                  <p>
                    {selectedProject
                      ? selectedProject.name
                      : "No project selected"}
                  </p>
                </div>

                <span className="site-count">
                  {sites.length} sites
                </span>
              </div>

              <div className="site-table">
                <div className="table-row table-head">
                  <span>Site</span>
                  <span>Area</span>
                  <span>Status</span>
                  <span>Action</span>
                </div>

                {sites.map((site) => (
                  <div
                    className={`table-row ${
                      selectedSite?.id === site.id
                        ? "selected-row"
                        : ""
                    }`}
                    key={site.id}
                  >
                    <span>
                      <strong>
                        {site.name}
                      </strong>
                    </span>

                    <span>
                      {site.area_hectares.toFixed(2)}{" "}
                      ha
                    </span>

                    <span>
                      <b className="status-dot" />
                      Monitoring
                    </span>

                    <button
                      className="view-button"
                      onClick={() => {
                        setSelectedSite(site);
                        setAnalyticsSite(site);
                      }}
                    >
                      View analytics →
                    </button>
                  </div>
                ))}

                {sites.length === 0 &&
                  !loading && (
                    <div className="empty">
                      No monitoring sites found.
                    </div>
                  )}
              </div>

              {analyticsSite && token && (
                <AnalyticsPanel
                  site={analyticsSite}
                  token={token}
                  onClose={() =>
                    setAnalyticsSite(null)
                  }
                />
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;