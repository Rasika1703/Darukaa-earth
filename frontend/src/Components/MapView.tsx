import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

type Site = {
  id: number;
  name: string;
  description: string | null;
  project_id: number;
  area_hectares: number;
  geometry: GeoJSON.Geometry;
};

type MapViewProps = {
  sites: Site[];
  onSiteClick: (site: Site) => void;
  projectId?: number;
  token?: string;
  onSiteCreated?: () => void;
};

const API_URL = "http://127.0.0.1:8000";
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapView({
  sites,
  onSiteClick,
  projectId,
  token,
  onSiteCreated,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [73.6, 18.7],
      zoom: 8,
    });

    map.addControl(
      new mapboxgl.NavigationControl(),
      "top-right",
    );

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
    });

    map.addControl(draw, "top-left");

    map.on("load", () => {
      const featureCollection: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: sites.map((site) => ({
          type: "Feature",
          properties: {
            id: site.id,
            name: site.name,
            area_hectares: site.area_hectares,
          },
          geometry: site.geometry,
        })),
      };

      map.addSource("sites", {
        type: "geojson",
        data: featureCollection,
      });

      map.addLayer({
        id: "site-fill",
        type: "fill",
        source: "sites",
        paint: {
          "fill-color": "#65a30d",
          "fill-opacity": 0.35,
        },
      });

      map.addLayer({
        id: "site-outline",
        type: "line",
        source: "sites",
        paint: {
          "line-color": "#84cc16",
          "line-width": 2,
        },
      });

      map.on("click", "site-fill", (event) => {
        const feature = event.features?.[0];

        if (!feature) return;

        const siteId = Number(
          feature.properties?.id,
        );

        const selectedSite = sites.find(
          (site) => site.id === siteId,
        );

        if (selectedSite) {
          onSiteClick(selectedSite);
        }
      });

      map.on("mouseenter", "site-fill", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "site-fill", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    // Save newly drawn polygon
   map.on("draw.create", async (event: any) => {
  if (!projectId || !token) return;

  const feature = event.features?.[0];

      if (
        !feature ||
        feature.geometry.type !== "Polygon"
      ) {
        return;
      }

      const name = window.prompt(
        "Enter monitoring site name:",
      );

      if (!name?.trim()) {
        draw.delete(feature.id as string);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/projects/${projectId}/sites`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: name.trim(),
              description:
                "Site created from Mapbox polygon",
              geometry: feature.geometry,
            }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          console.error(data);
          alert(
            data.detail ||
              "Failed to create monitoring site.",
          );
          return;
        }

        alert(
          `Site "${name.trim()}" created successfully.`,
        );

        draw.delete(feature.id as string);

        onSiteCreated?.();
      } catch (error) {
        console.error(error);
        alert(
          "Could not connect to the backend.",
        );
      }
    });

    return () => {
      map.remove();
    };
  }, [sites, onSiteClick, projectId, token, onSiteCreated]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="map-placeholder">
        <div>
          <strong>Mapbox token required</strong>
          <p>
            Add VITE_MAPBOX_TOKEN to frontend/.env
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapContainer}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "520px",
        borderRadius: "20px",
        overflow: "hidden",
      }}
    />
  );
}