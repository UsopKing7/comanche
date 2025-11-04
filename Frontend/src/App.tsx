import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN!;

interface PlantaInfo {
  nombre_comun: string;
  nombre_cientifico: string;
  edad_estimada: string;
  estado_floracion: string;
  observaciones: string;
}

export const App = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [plantaSeleccionada, setPlantaSeleccionada] = useState<PlantaInfo | null>(null);
  const [mostrarPanel, setMostrarPanel] = useState(false);

  useEffect(() => {
    if (map.current) return;

    const TARGET_COORDS: [number, number] = [-68.42345071386454, -16.965480458906463];

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: "mapbox://styles/mapbox/navigation-night-v1",
      center: TARGET_COORDS,
      zoom: 13,
      pitch: 45,
      bearing: 30,
      antialias: true,
    });

    map.current.on("load", async () => {
      // 🔹 Terreno 3D
      map.current!.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.mapbox-terrain-dem-v1",
        tileSize: 512,
        maxzoom: 14,
      });
      map.current!.setTerrain({ source: "mapbox-dem", exaggeration: 1 });
      map.current!.setLight({ anchor: "viewport", intensity: 0.9 });

      // 🌆 Edificios 3D (casas, hospitales, etc.)
      const layers = map.current!.getStyle().layers;
      const labelLayerId = layers.find(
        (layer) => layer.type === "symbol" && layer.layout && layer.layout["text-field"]
      )?.id;

      map.current!.addLayer(
        {
          id: "3d-buildings",
          source: "composite",
          "source-layer": "building",
          filter: ["==", "extrude", "true"],
          type: "fill-extrusion",
          minzoom: 15,
          paint: {
            "fill-extrusion-color": "#d9d9d9",
            "fill-extrusion-height": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15,
              0,
              15.05,
              ["get", "height"],
            ],
            "fill-extrusion-base": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15,
              0,
              15.05,
              ["get", "min_height"],
            ],
            "fill-extrusion-opacity": 0.8,
          },
        },
        labelLayerId
      );

      // 🔹 Movimiento inicial
      map.current!.flyTo({
        center: TARGET_COORDS,
        zoom: 15,
        pitch: 60,
        bearing: 30,
        speed: 0.6,
        curve: 1.4,
        essential: true,
      });

      try {
        // 🌱 Puyas
        const resPuyas = await fetch("http://localhost:3333/api/puyas_info");
        const puyas = await resPuyas.json();

        map.current!.addSource("puyas", { type: "geojson", data: puyas });

        map.current!.addLayer({
          id: "puyas-points",
          type: "circle",
          source: "puyas",
          paint: {
            "circle-radius": 8,
            "circle-color": "#00ff4c",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });

        map.current!.on("mouseenter", "puyas-points", (e) => {
          map.current!.getCanvas().style.cursor = "pointer";
          if (!e.features || e.features.length === 0) return;
          const props = e.features[0].properties as any;
          const plantaInfo: PlantaInfo = {
            nombre_comun: props.nombre_comun || "Sin nombre común",
            nombre_cientifico: props.nombre_cientifico || "Sin nombre científico",
            edad_estimada: props.edad_estimada || "No especificada",
            estado_floracion: props.estado_floracion || "No especificado",
            observaciones: props.observaciones || "Ninguna",
          };
          setPlantaSeleccionada(plantaInfo);
          setMostrarPanel(true);
        });

        map.current!.on("mouseleave", "puyas-points", () => {
          map.current!.getCanvas().style.cursor = "";
          setMostrarPanel(false);
        });

        map.current!.on("click", "puyas-points", (e) => {
          if (!e.features || e.features.length === 0) return;
          const feature = e.features[0];
          const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
          const props = feature.properties as any;

          new mapboxgl.Popup()
            .setLngLat(coords)
            .setHTML(`
              <div class="click-popup-content">
                <h4>${props.nombre_comun || "Sin nombre"}</h4>
                <p><strong>Nombre científico:</strong> ${props.nombre_cientifico || "No especificado"}</p>
                <p><strong>Edad estimada:</strong> ${props.edad_estimada || "No especificada"}</p>
                <p><strong>Estado de floración:</strong> ${props.estado_floracion || "No especificado"}</p>
                <p><strong>Observaciones:</strong> ${props.observaciones || "Ninguna"}</p>
              </div>
            `)
            .addTo(map.current!);
        });

        // 🚶 Track de recorrido (color rojo)
        const resTrack = await fetch("http://localhost:3333/api/track");
        const trackGeoJSON = await resTrack.json();

        map.current!.addSource("track", {
          type: "geojson",
          data: trackGeoJSON,
        });

        map.current!.addLayer({
          id: "track-line",
          type: "line",
          source: "track",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#ff0000", // Color rojo
            "line-width": 4,
            "line-opacity": 0.8,
          },
        });

        // 🏞️ Curvas de nivel 20s (color naranja)
        const resCurvas20s = await fetch("http://localhost:3333/api/curva20s");
        const curvas20s = await resCurvas20s.json();

        map.current!.addSource("curvas20s", {
          type: "geojson",
          data: curvas20s,
        });

        map.current!.addLayer({
          id: "curvas20s-line",
          type: "line",
          source: "curvas20s",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#ff8c00", // Color naranja
            "line-width": 3,
            "line-opacity": 0.8,
          },
        });

        // 🏞️ Curvas de nivel 5s (color azul)
        const resCurvas5s = await fetch("http://localhost:3333/api/curva5s");
        const curvas5s = await resCurvas5s.json();

        map.current!.addSource("curvas5s", {
          type: "geojson",
          data: curvas5s,
        });

        map.current!.addLayer({
          id: "curvas5s-line",
          type: "line",
          source: "curvas5s",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#0066ff", // Color azul
            "line-width": 1,
            "line-opacity": 0.6,
          },
        });

        // 📍 Ajuste de límites del track
        const bounds = new mapboxgl.LngLatBounds();
        trackGeoJSON.features.forEach((feature: any) => {
          const coords = feature.geometry.coordinates.flat(Infinity);
          for (let i = 0; i < coords.length; i += 2) {
            bounds.extend([coords[i], coords[i + 1]]);
          }
        });
        map.current!.fitBounds(bounds, { padding: 60, duration: 2000 });

      } catch (err) {
        console.error("❌ Error al cargar datos:", err);
      }
    });
  }, []);

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
            <h1>🗺️ Mapa de Puyas, Recorrido y Curvas de Nivel</h1>
            <p>Ubicación: -16.96548, -68.42345</p>
            <p><small>Pasa el cursor sobre los puntos verdes para ver información</small></p>
            <div className="map-legend">
              <div className="legend-item">
                <div className="legend-color" style={{backgroundColor: "#00ff4c"}}></div>
                <span>Puyas</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{backgroundColor: "#ff0000"}}></div>
                <span>Track de recorrido</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{backgroundColor: "#ff8c00"}}></div>
                <span>Curvas 20m</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{backgroundColor: "#0066ff"}}></div>
                <span>Curvas 5m</span>
              </div>
            </div>
          </div>

          <div className="map-controls">
            <button
              className="control-btn"
              onClick={() =>
                map.current?.flyTo({
                  center: [-68.42345071386454, -16.965480458906463],
                  zoom: 16,
                  pitch: 60,
                  bearing: 30,
                  speed: 0.8,
                  curve: 1.2,
                })
              }
            >
              Vista principal
            </button>

            <button
              className="control-btn"
              onClick={() =>
                map.current?.flyTo({
                  zoom: 12,
                  pitch: 0,
                  bearing: 0,
                  speed: 1.2,
                })
              }
            >
              Vista 2D
            </button>

            <button
              className="control-btn"
              onClick={() =>
                map.current?.flyTo({
                  zoom: 17,
                  pitch: 75,
                  bearing: 0,
                  speed: 1.0,
                })
              }
            >
              Vista Detallada
            </button>

            <button
              className="control-btn"
              onClick={() => {
                if (map.current) {
                  const curvas20sVisible = map.current.getLayoutProperty('curvas20s-line', 'visibility');
                  map.current.setLayoutProperty(
                    'curvas20s-line', 
                    'visibility', 
                    curvas20sVisible === 'visible' ? 'none' : 'visible'
                  );
                }
              }}
            >
              Toggle Curvas 20m
            </button>

            <button
              className="control-btn"
              onClick={() => {
                if (map.current) {
                  const curvas5sVisible = map.current.getLayoutProperty('curvas5s-line', 'visibility');
                  map.current.setLayoutProperty(
                    'curvas5s-line', 
                    'visibility', 
                    curvas5sVisible === 'visible' ? 'none' : 'visible'
                  );
                }
              }}
            >
              Toggle Curvas 5m
            </button>
          </div>
        </div>

        {/* Panel lateral */}
        <div className={`info-panel ${mostrarPanel ? "visible" : ""}`}>
          <div className="info-panel-content">
            <div className="info-panel-header">
              <h3>🌱 Información de la Planta</h3>
              <button className="close-btn" onClick={() => setMostrarPanel(false)}>
                ×
              </button>
            </div>

            {plantaSeleccionada ? (
              <div className="planta-info">
                <div className="info-row">
                  <span className="info-label">Nombre común:</span>
                  <span className="info-value">{plantaSeleccionada.nombre_comun}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Nombre científico:</span>
                  <span className="info-value scientific">{plantaSeleccionada.nombre_cientifico}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Edad estimada:</span>
                  <span className="info-value">{plantaSeleccionada.edad_estimada}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Estado de floración:</span>
                  <span className="info-value">{plantaSeleccionada.estado_floracion}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Observaciones:</span>
                  <span className="info-value">{plantaSeleccionada.observaciones}</span>
                </div>
              </div>
            ) : (
              <div className="no-selection">
                <p>Pasa el cursor sobre una planta para ver su información</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .map-container { width:100%; height:100vh; position:relative; overflow:hidden; }
        .map-overlay { position:absolute; top:0; left:0; right:0; z-index:1; padding:20px; pointer-events:none; }
        .map-title {
          background: rgba(255,255,255,0.9);
          border-radius:12px; padding:15px 20px; margin-bottom:10px;
          box-shadow:0 4px 10px rgba(0,0,0,0.1); max-width:450px;
        }
        .map-title h1 { margin:0 0 5px 0; font-size:1.3rem; color:#2b2b2b; }
        .map-title p { margin:0 0 3px 0; font-size:0.9rem; color:#555; }

        .map-legend {
          margin-top:10px; padding-top:10px; border-top:1px solid rgba(0,0,0,0.1);
          pointer-events:auto;
        }
        .legend-item {
          display:flex; align-items:center; margin-bottom:5px;
        }
        .legend-color {
          width:16px; height:16px; border-radius:3px; margin-right:8px;
          border:1px solid rgba(0,0,0,0.2);
        }

        .map-controls { display:flex; gap:10px; pointer-events:auto; flex-wrap: wrap; }
        .control-btn {
          background: rgba(255,255,255,0.9);
          border:none; border-radius:8px;
          padding:10px 14px; font-size:0.9rem; cursor:pointer;
          box-shadow:0 2px 8px rgba(0,0,0,0.15); transition:0.2s;
        }
        .control-btn:hover { background:white; transform:translateY(-2px); }

        .info-panel {
          position:absolute; top:20px; right:20px;
          width:320px; background:rgba(255,255,255,0.95);
          border-radius:12px; box-shadow:0 6px 20px rgba(0,0,0,0.15);
          transform:translateX(400px); transition:0.3s ease;
          z-index:2;
        }
        .info-panel.visible { transform:translateX(0); }
        .info-panel-header {
          display:flex; justify-content:space-between; align-items:center;
          padding:15px 20px; border-bottom:1px solid rgba(0,0,0,0.1);
        }
        .close-btn { background:none; border:none; font-size:1.4rem; cursor:pointer; color:#555; }
        .planta-info { padding:20px; }
        .info-row { display:flex; margin-bottom:10px; }
        .info-label { font-weight:600; width:130px; color:#333; font-size:0.9rem; }
        .info-value { flex:1; color:#555; font-size:0.9rem; }
        .info-value.scientific { font-style:italic; color:#2e7d32; }
        .no-selection { padding:30px 20px; color:#666; text-align:center; }
        .click-popup-content h4 { margin:0 0 8px 0; color:#2e7d32; border-bottom:1px solid #ddd; }
      `}</style>
    </>
  );
};