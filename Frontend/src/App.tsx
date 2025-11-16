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

interface LayerControl {
  puyas: boolean;
  track: boolean;
  curvas20s: boolean;
  curvas5s: boolean;
  buildings3d: boolean;
}

export const App = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [plantaSeleccionada, setPlantaSeleccionada] = useState<PlantaInfo | null>(null);
  const [mostrarPanel, setMostrarPanel] = useState(false);
  const [mostrarControles, setMostrarControles] = useState(true);
  const [layers, setLayers] = useState<LayerControl>({
    puyas: true,
    track: true,
    curvas20s: true,
    curvas5s: true,
    buildings3d: true
  });

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
      map.current!.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.mapbox-terrain-dem-v1",
        tileSize: 512,
        maxzoom: 14,
      });
      map.current!.setTerrain({ source: "mapbox-dem", exaggeration: 1 });
      map.current!.setLight({ anchor: "viewport", intensity: 0.9 });

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
        const resPuyas = await fetch("https://comanche-7g0j.onrender.com/api/puyas_info");
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

        const resTrack = await fetch("https://comanche-7g0j.onrender.com/api/track");
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
            "line-color": "rgba(255, 0, 0, 1)",
            "line-width": 5,
            "line-opacity": 0.8,
          },
        });

        const resCurvas20s = await fetch("https://comanche-7g0j.onrender.com/api/curva20s");
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
            "line-color": "rgba(255, 140, 0, 1)", 
            "line-width": 4,
            "line-opacity": 0.8,
          },
        });

        const resCurvas5s = await fetch("https://comanche-7g0j.onrender.com/api/curva5s");
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
            "line-color": "rgba(255, 0, 225, 1)",
            "line-width": 3,
            "line-opacity": 0.6,
          },
        });

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

  const toggleLayer = (layerId: keyof LayerControl) => {
    if (!map.current) return;
    
    const newLayers = { ...layers, [layerId]: !layers[layerId] };
    setLayers(newLayers);

    switch (layerId) {
      case 'puyas':
        map.current.setLayoutProperty('puyas-points', 'visibility', newLayers.puyas ? 'visible' : 'none');
        break;
      case 'track':
        map.current.setLayoutProperty('track-line', 'visibility', newLayers.track ? 'visible' : 'none');
        break;
      case 'curvas20s':
        map.current.setLayoutProperty('curvas20s-line', 'visibility', newLayers.curvas20s ? 'visible' : 'none');
        break;
      case 'curvas5s':
        map.current.setLayoutProperty('curvas5s-line', 'visibility', newLayers.curvas5s ? 'visible' : 'none');
        break;
      case 'buildings3d':
        map.current.setLayoutProperty('3d-buildings', 'visibility', newLayers.buildings3d ? 'visible' : 'none');
        break;
    }
  };

  const toggleAllLayers = (enable: boolean) => {
    const newLayers = {
      puyas: enable,
      track: enable,
      curvas20s: enable,
      curvas5s: enable,
      buildings3d: enable
    };
    setLayers(newLayers);

    if (map.current) {
      map.current.setLayoutProperty('puyas-points', 'visibility', enable ? 'visible' : 'none');
      map.current.setLayoutProperty('track-line', 'visibility', enable ? 'visible' : 'none');
      map.current.setLayoutProperty('curvas20s-line', 'visibility', enable ? 'visible' : 'none');
      map.current.setLayoutProperty('curvas5s-line', 'visibility', enable ? 'visible' : 'none');
      map.current.setLayoutProperty('3d-buildings', 'visibility', enable ? 'visible' : 'none');
    }
  };

  return (
    <>
      <div className="map-container" ref={mapContainer}>
        {/* Control Panel */}
        <div className={`control-panel ${mostrarControles ? "expanded" : "collapsed"}`}>
          <div className="control-panel-header">
            <div className="header-content">
              <div className="panel-icon">⚙️</div>
              <h3>Control de Capas</h3>
            </div>
            <button 
              className="toggle-panel-btn"
              onClick={() => setMostrarControles(!mostrarControles)}
            >
              {mostrarControles ? "‹" : "›"}
            </button>
          </div>

          {mostrarControles && (
            <div className="control-panel-content">
              <div className="layer-controls-grid">
                <div className="layer-control">
                  <label className="layer-checkbox">
                    <input
                      type="checkbox"
                      checked={layers.puyas}
                      onChange={() => toggleLayer('puyas')}
                    />
                    <span className="checkmark"></span>
                    <div className="layer-info">
                      <div className="layer-color-indicator" style={{backgroundColor: "#00ff4c"}}></div>
                      <span className="layer-label">Puyas Raimondi</span>
                    </div>
                  </label>
                </div>

                <div className="layer-control">
                  <label className="layer-checkbox">
                    <input
                      type="checkbox"
                      checked={layers.track}
                      onChange={() => toggleLayer('track')}
                    />
                    <span className="checkmark"></span>
                    <div className="layer-info">
                      <div className="layer-color-indicator" style={{backgroundColor: "#ff0000"}}></div>
                      <span className="layer-label">Recorrido</span>
                    </div>
                  </label>
                </div>

                <div className="layer-control">
                  <label className="layer-checkbox">
                    <input
                      type="checkbox"
                      checked={layers.curvas20s}
                      onChange={() => toggleLayer('curvas20s')}
                    />
                    <span className="checkmark"></span>
                    <div className="layer-info">
                      <div className="layer-color-indicator" style={{backgroundColor: "#ff8c00"}}></div>
                      <span className="layer-label">Curvas 20m</span>
                    </div>
                  </label>
                </div>

                <div className="layer-control">
                  <label className="layer-checkbox">
                    <input
                      type="checkbox"
                      checked={layers.curvas5s}
                      onChange={() => toggleLayer('curvas5s')}
                    />
                    <span className="checkmark"></span>
                    <div className="layer-info">
                      <div className="layer-color-indicator" style={{backgroundColor: "#ff00e1"}}></div>
                      <span className="layer-label">Curvas 5m</span>
                    </div>
                  </label>
                </div>

                <div className="layer-control">
                  <label className="layer-checkbox">
                    <input
                      type="checkbox"
                      checked={layers.buildings3d}
                      onChange={() => toggleLayer('buildings3d')}
                    />
                    <span className="checkmark"></span>
                    <div className="layer-info">
                      <div className="layer-color-indicator" style={{backgroundColor: "#d9d9d9"}}></div>
                      <span className="layer-label">Edificios 3D</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="bulk-actions">
                <button 
                  className="bulk-btn activate-all"
                  onClick={() => toggleAllLayers(true)}
                >
                  Activar Todas
                </button>
                <button 
                  className="bulk-btn deactivate-all"
                  onClick={() => toggleAllLayers(false)}
                >
                  Desactivar Todas
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <button
            className="action-btn primary"
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
            Vista Principal
          </button>

          <button
            className="action-btn"
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
            className="action-btn"
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
        </div>

        {/* Plant Info Panel */}
        <div className={`info-panel ${mostrarPanel ? "visible" : ""}`}>
          <div className="info-panel-content">
            <div className="info-panel-header">
              <h3>Información de la Planta</h3>
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
        .map-container { 
          width:100%; 
          height:100vh; 
          position:relative; 
          overflow:hidden; 
          background: #0f172a;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* Control Panel Styles */
        .control-panel {
          position: absolute;
          top: 24px;
          right: 24px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(16px);
          border-radius: 12px;
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.12),
            0 2px 8px rgba(0, 0, 0, 0.08);
          z-index: 10;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(255, 255, 255, 0.8);
          overflow: hidden;
          min-width: 280px;
        }

        .control-panel.collapsed {
          width: 60px;
          height: 60px;
        }

        .control-panel.expanded {
          width: 320px;
        }

        .control-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .control-panel-header:hover {
          background: linear-gradient(135deg, #334155 0%, #475569 100%);
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .panel-icon {
          font-size: 1.2rem;
        }

        .control-panel-header h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: -0.01em;
        }

        .toggle-panel-btn {
          background: rgba(255, 255, 255, 0.15);
          border: none;
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .toggle-panel-btn:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: scale(1.05);
        }

        .control-panel-content {
          padding: 20px;
        }

        .layer-controls-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }

        .layer-control {
          display: flex;
          align-items: center;
        }

        .layer-checkbox {
          display: flex;
          align-items: center;
          cursor: pointer;
          width: 100%;
          padding: 10px 0;
          transition: all 0.2s ease;
          border-radius: 8px;
        }

        .layer-checkbox:hover {
          background: rgba(0, 0, 0, 0.02);
        }

        .layer-checkbox input {
          display: none;
        }

        .checkmark {
          width: 18px;
          height: 18px;
          border: 2px solid #e2e8f0;
          border-radius: 4px;
          margin-right: 12px;
          position: relative;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .layer-checkbox input:checked + .checkmark {
          background: #3b82f6;
          border-color: #3b82f6;
        }

        .layer-checkbox input:checked + .checkmark::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%) rotate(45deg);
          width: 4px;
          height: 8px;
          border: solid white;
          border-width: 0 2px 2px 0;
        }

        .layer-info {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
        }

        .layer-color-indicator {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          flex-shrink: 0;
        }

        .layer-label {
          font-weight: 500;
          color: #374151;
          font-size: 0.9rem;
        }

        .bulk-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #f1f5f9;
        }

        .bulk-btn {
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .activate-all {
          background: #10b981;
          color: white;
        }

        .activate-all:hover {
          background: #059669;
          transform: translateY(-1px);
        }

        .deactivate-all {
          background: #ef4444;
          color: white;
        }

        .deactivate-all:hover {
          background: #dc2626;
          transform: translateY(-1px);
        }

        /* Quick Actions */
        .quick-actions {
          position: absolute;
          top: 24px;
          left: 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          z-index: 5;
        }

        .action-btn {
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.8);
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          min-width: 140px;
          text-align: center;
        }

        .action-btn.primary {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .action-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .action-btn.primary:hover {
          background: #2563eb;
        }

        /* Info Panel Styles */
        .info-panel {
          position: absolute;
          top: 50%;
          left: 24px;
          transform: translateY(-50%) translateX(-400px);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 10;
          width: 320px;
        }

        .info-panel.visible {
          transform: translateY(-50%) translateX(0);
        }

        .info-panel-content {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(16px);
          border-radius: 12px;
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.12),
            0 2px 8px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.8);
          overflow: hidden;
        }

        .info-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          color: white;
        }

        .info-panel-header h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .close-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          cursor: pointer;
          color: white;
          font-size: 1.2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.05);
        }

        .planta-info {
          padding: 20px;
        }

        .info-row {
          display: flex;
          margin-bottom: 16px;
          align-items: flex-start;
        }

        .info-label {
          font-weight: 600;
          width: 140px;
          color: #374151;
          font-size: 0.85rem;
          flex-shrink: 0;
        }

        .info-value {
          flex: 1;
          color: #6b7280;
          font-size: 0.85rem;
          line-height: 1.4;
        }

        .info-value.scientific {
          font-style: italic;
          color: #059669;
          font-weight: 500;
        }

        .no-selection {
          padding: 40px 20px;
          color: #9ca3af;
          text-align: center;
          font-style: italic;
          font-size: 0.9rem;
        }

        /* Popup Styles */
        .click-popup-content h4 {
          margin: 0 0 8px 0;
          color: #059669;
          font-size: 1rem;
          font-weight: 600;
        }

        .click-popup-content p {
          margin: 6px 0;
          font-size: 0.85rem;
          color: #6b7280;
        }

        .click-popup-content strong {
          color: #374151;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .control-panel.expanded {
            width: calc(100vw - 48px);
            right: 24px;
          }
          
          .info-panel {
            width: calc(100vw - 48px);
            left: 24px;
          }
          
          .quick-actions {
            flex-direction: row;
            flex-wrap: wrap;
          }
          
          .action-btn {
            min-width: 120px;
            padding: 10px 16px;
          }
        }

        /* Scrollbar Styling */
        .control-panel-content::-webkit-scrollbar {
          width: 6px;
        }

        .control-panel-content::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }

        .control-panel-content::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        .control-panel-content::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </>
  );
};