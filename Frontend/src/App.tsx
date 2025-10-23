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

    // NUEVAS COORDENADAS - Actualizadas con tu ubicación
    const TARGET_COORDS: [number, number] = [-68.42345071386454, -16.965480458906463];

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: "mapbox://styles/mapbox/navigation-day-v1",
      center: TARGET_COORDS, // Usar las nuevas coordenadas
      zoom: 12,
      pitch: 45,
      bearing: 20,
      antialias: true,
    });

    map.current.on("load", async () => {
      map.current!.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.mapbox-terrain-dem-v1",
        tileSize: 512,
        maxzoom: 14,
      });
      map.current!.setTerrain({ source: "mapbox-dem", exaggeration: 2.5 });
      map.current!.setLight({ anchor: "viewport", intensity: 0.9 });

      // Volar directamente a las nuevas coordenadas
      map.current!.flyTo({
        center: TARGET_COORDS,
        zoom: 14,
        pitch: 60,
        bearing: 30,
        speed: 0.8,
        curve: 1.2,
        essential: true,
      });

      try {
        const res = await fetch("http://localhost:3333/api/puyas_info");
        const geojson = await res.json();

        map.current!.addSource("puyas", {
          type: "geojson",
          data: geojson,
        });

        map.current!.addLayer({
          id: "puyas-points",
          type: "circle",
          source: "puyas",
          paint: {
            "circle-radius": 8,
            "circle-color": "#1cff07",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });

        // Evento hover para mostrar información en el panel
        map.current!.on("mouseenter", "puyas-points", (e) => {
          map.current!.getCanvas().style.cursor = "pointer";
          
          if (!e.features || e.features.length === 0) return;
          
          const props = e.features[0].properties as any;
          const plantaInfo: PlantaInfo = {
            nombre_comun: props.nombre_comun || 'Sin nombre común',
            nombre_cientifico: props.nombre_cientifico || 'Sin nombre científico',
            edad_estimada: props.edad_estimada || 'No especificada',
            estado_floracion: props.estado_floracion || 'No especificado',
            observaciones: props.observaciones || 'Ninguna'
          };
          
          setPlantaSeleccionada(plantaInfo);
          setMostrarPanel(true);
        });

        // Evento para ocultar panel cuando el mouse sale del punto
        map.current!.on("mouseleave", "puyas-points", () => {
          map.current!.getCanvas().style.cursor = "";
          setMostrarPanel(false);
        });

        // Popup al click (mantener funcionalidad)
        map.current!.on("click", "puyas-points", (e) => {
          if (!e.features || e.features.length === 0) return;

          const feature = e.features[0];
          const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
          const props = feature.properties as any;

          new mapboxgl.Popup()
            .setLngLat(coords)
            .setHTML(`
              <div class="click-popup-content">
                <h4>${props.nombre_comun || 'Sin nombre'}</h4>
                <p><strong>Nombre científico:</strong> ${props.nombre_cientifico || 'No especificado'}</p>
                <p><strong>Edad estimada:</strong> ${props.edad_estimada || 'No especificada'}</p>
                <p><strong>Estado de floración:</strong> ${props.estado_floracion || 'No especificado'}</p>
                <p><strong>Observaciones:</strong> ${props.observaciones || 'Ninguna'}</p>
              </div>
            `)
            .addTo(map.current!);
        });

      } catch (err) {
        console.error("❌ Error al cargar datos GeoJSON:", err);
      }

      // Marcador en las nuevas coordenadas
      new mapboxgl.Marker({ color: "#ff4f00" })
        .setLngLat(TARGET_COORDS)
        .setPopup(
          new mapboxgl.Popup().setHTML(`<b>Ubicación Objetivo</b><br>Lat: -16.96548<br>Lon: -68.42345`)
        )
        .addTo(map.current!);
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
            <h1>🗺️ Mapa de Puyas</h1>
            <p>Ubicación: -16.96548, -68.42345</p>
            <p><small>Pasa el cursor sobre los puntos verdes para ver información</small></p>
          </div>

          <div className="map-controls">
            <button
              className="control-btn"
              onClick={() =>
                map.current?.flyTo({
                  center: [-68.42345071386454, -16.965480458906463], // Nuevas coordenadas
                  zoom: 14,
                  pitch: 60,
                  bearing: 30,
                  speed: 0.8,
                  curve: 1.2,
                })
              }
            >
              Ir a Ubicación
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

            <button
              className="control-btn"
              onClick={() =>
                map.current?.flyTo({
                  center: [-68.42345071386454, -16.965480458906463],
                  zoom: 16,
                  pitch: 75,
                  bearing: 0,
                  speed: 1.0,
                })
              }
            >
              Vista Detallada
            </button>
          </div>
        </div>

        {/* Panel de información de la planta */}
        <div className={`info-panel ${mostrarPanel ? 'visible' : ''}`}>
          <div className="info-panel-content">
            <div className="info-panel-header">
              <h3>🌱 Información de la Planta</h3>
              <button 
                className="close-btn"
                onClick={() => setMostrarPanel(false)}
              >
                ×
              </button>
            </div>
            
            {plantaSeleccionada && (
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
            )}
            
            {!plantaSeleccionada && (
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
        }
        
        .map-overlay { 
          position:absolute; 
          top:0; 
          left:0; 
          right:0; 
          z-index:1; 
          padding:20px; 
          pointer-events:none; 
        }
        
        .map-title {
          background: rgba(255,255,255,0.95); 
          border-radius:10px; 
          padding:15px 20px;
          margin-bottom:15px; 
          box-shadow:0 4px 12px rgba(0,0,0,0.1);
          max-width:380px; 
          backdrop-filter:blur(5px); 
          border:1px solid rgba(255,255,255,0.5);
        }
        
        .map-title h1 { 
          margin:0 0 5px 0; 
          font-size:1.3rem; 
          color:#333; 
          font-weight:600; 
        }
        
        .map-title p { 
          margin:0 0 5px 0; 
          font-size:0.9rem; 
          color:#666; 
        }
        
        .map-title small { 
          font-size:0.8rem; 
          color:#888; 
        }
        
        .map-controls { 
          display:flex; 
          gap:10px; 
          flex-wrap: wrap;
          pointer-events:auto; 
        }
        
        .control-btn {
          background: rgba(255,255,255,0.9); 
          border:none; 
          border-radius:8px;
          padding:10px 15px; 
          font-size:0.9rem; 
          font-weight:500; 
          color:#333; 
          cursor:pointer;
          box-shadow:0 2px 8px rgba(0,0,0,0.15); 
          transition:all 0.2s ease; 
          backdrop-filter:blur(5px);
          border:1px solid rgba(255,255,255,0.5);
          white-space: nowrap;
        }
        
        .control-btn:hover {
          background: rgba(255,255,255,1); 
          transform:translateY(-2px); 
          box-shadow:0 4px 12px rgba(0,0,0,0.2);
        }
        
        .control-btn:active { 
          transform:translateY(0); 
        }

        /* Panel de información */
        .info-panel {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 320px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 12px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.7);
          transform: translateX(400px);
          transition: transform 0.3s ease;
          z-index: 2;
          pointer-events: auto;
        }

        .info-panel.visible {
          transform: translateX(0);
        }

        .info-panel-content {
          padding: 0;
        }

        .info-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(76, 175, 80, 0.1);
          border-radius: 12px 12px 0 0;
        }

        .info-panel-header h3 {
          margin: 0;
          color: #2e7d32;
          font-size: 1.1rem;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background-color 0.2s;
        }

        .close-btn:hover {
          background: rgba(0, 0, 0, 0.1);
        }

        .planta-info {
          padding: 20px;
        }

        .info-row {
          display: flex;
          margin-bottom: 12px;
          align-items: flex-start;
        }

        .info-label {
          font-weight: 600;
          color: #333;
          min-width: 140px;
          font-size: 0.9rem;
        }

        .info-value {
          color: #666;
          flex: 1;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .info-value.scientific {
          font-style: italic;
          color: #2e7d32;
        }

        .no-selection {
          padding: 40px 20px;
          text-align: center;
          color: #666;
        }

        .no-selection p {
          margin: 0;
          font-size: 0.9rem;
        }

        /* Estilos para el popup de click */
        .click-popup-content h4 {
          margin: 0 0 10px 0;
          color: #2e7d32;
          border-bottom: 1px solid #eee;
          padding-bottom: 5px;
        }
        
        .click-popup-content p {
          margin: 5px 0;
          font-size: 0.9rem;
        }
      `}</style>
    </>
  );
};