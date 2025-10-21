import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN!;

export const App = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (map.current) return;

    // 📍 Coordenadas exactas de Comanche (La Paz, Bolivia)
    const COMANCHE_COORDS: [number, number] = [-68.5017, -17.0832];

    // 🗺️ Crear mapa base
    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: COMANCHE_COORDS,
      zoom: 12,
      pitch: 45,
      bearing: 20,
      antialias: true,
    });

    map.current.on("load", async () => {
      // 🌄 Agregar terreno 3D
      map.current!.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.mapbox-terrain-dem-v1",
        tileSize: 512,
        maxzoom: 14,
      });
      map.current!.setTerrain({ source: "mapbox-dem", exaggeration: 2.5 });
      map.current!.setLight({ anchor: "viewport", intensity: 0.9 });

      // ✈️ Animación inicial: volar hacia Comanche
      map.current!.flyTo({
        center: COMANCHE_COORDS,
        zoom: 14,
        pitch: 60,
        bearing: 30,
        speed: 0.8,
        curve: 1.2,
        essential: true,
      });

      // 📦 Obtener puntos desde el backend
      try {
        const res = await fetch("http://localhost:3333/api/puyas");
        const geojson = await res.json();

        // 🔹 Agregar capa de puntos
        map.current!.addSource("puyas", {
          type: "geojson",
          data: geojson,
        });

        map.current!.addLayer({
          id: "puyas-points",
          type: "circle",
          source: "puyas",
          paint: {
            "circle-radius": 6,
            "circle-color": "#ff4f00",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });

        // 💬 Popup con info
        map.current!.on("click", "puyas-points", (e) => {
          const coordinates = (e.features?.[0].geometry as GeoJSON.Point)
            .coordinates as [number, number];
          const { id, fid } = e.features?.[0].properties as {
            id: string;
            fid: string;
          };

          new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(`<b>ID:</b> ${id}<br><b>FID:</b> ${fid}`)
            .addTo(map.current!);
        });

        map.current!.on("mouseenter", "puyas-points", () => {
          map.current!.getCanvas().style.cursor = "pointer";
        });
        map.current!.on("mouseleave", "puyas-points", () => {
          map.current!.getCanvas().style.cursor = "";
        });
      } catch (err) {
        console.error("❌ Error al cargar datos GeoJSON:", err);
      }

      // 📍 Marcador fijo en Comanche (opcional)
      new mapboxgl.Marker({ color: "#ff4f00" })
        .setLngLat(COMANCHE_COORDS)
        .setPopup(
          new mapboxgl.Popup().setHTML(
            `<b>Comanche, La Paz</b><br>Centro del mapa`
          )
        )
        .addTo(map.current!);
    });
  }, []);

  // 🧭 Controles extra
  useEffect(() => {
    if (!map.current) return;
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.current.addControl(new mapboxgl.FullscreenControl());
  }, []);

  return (
    <>
      <div className="map-container" ref={mapContainer}>
        <div className="map-overlay">
          <div className="map-title">
            <h1>🗺️ Comanche 3D Map</h1>
            <p>Explora Comanche con tus puntos de PostGIS</p>
          </div>

          <div className="map-controls">
            <button
              className="control-btn"
              onClick={() =>
                map.current?.flyTo({
                  center: [-68.5017, -17.0832],
                  zoom: 14,
                  pitch: 60,
                  bearing: 30,
                  speed: 0.8,
                  curve: 1.2,
                })
              }
            >
              Ir a Comanche
            </button>

            <button
              className="control-btn"
              onClick={() =>
                map.current?.flyTo({
                  zoom: 10,
                  pitch: 0,
                  bearing: 0,
                  speed: 1.2,
                })
              }
            >
              Vista 2D
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .map-container {
          width: 100%;
          height: 100vh;
          position: relative;
          overflow: hidden;
        }
        .map-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1;
          padding: 20px;
          pointer-events: none;
        }
        .map-title {
          background: rgba(255, 255, 255, 0.9);
          border-radius: 10px;
          padding: 15px 20px;
          margin-bottom: 15px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          max-width: 320px;
          backdrop-filter: blur(5px);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }
        .map-title h1 {
          margin: 0 0 5px 0;
          font-size: 1.3rem;
          color: #333;
          font-weight: 600;
        }
        .map-title p {
          margin: 0;
          font-size: 0.9rem;
          color: #666;
        }
        .map-controls {
          display: flex;
          gap: 10px;
          pointer-events: auto;
        }
        .control-btn {
          background: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 8px;
          padding: 10px 15px;
          font-size: 0.9rem;
          font-weight: 500;
          color: #333;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          transition: all 0.2s ease;
          backdrop-filter: blur(5px);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }
        .control-btn:hover {
          background: rgba(255, 255, 255, 1);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        .control-btn:active {
          transform: translateY(0);
        }
      `}</style>
    </>
  );
};
