import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN!;

export const App = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: "mapbox://styles/mapbox/satellite-streets-v12", 
      center: [-68.1193, -16.5000], 
      zoom: 13,
      pitch: 60,
      bearing: 20,
      antialias: true,
    });

    map.current.on("load", () => {
      map.current!.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.mapbox-terrain-dem-v1",
        tileSize: 512,
        maxzoom: 14,
      });

      map.current!.setTerrain({ source: "mapbox-dem", exaggeration: 2.5 });
      map.current!.setLight({ anchor: "viewport", intensity: 0.8 });
    });
  }, []);

  return (
    <>
      <div className="map-container" ref={mapContainer}>
        <div className="map-overlay">
          <div className="map-title">
            <h1>Mapa 3D Interactivo</h1>
            <p>Explora el terreno en 3D con relieve exagerado</p>
          </div>
          <div className="map-controls">
            <button 
              className="control-btn" 
              onClick={() => map.current?.flyTo({zoom: 13, pitch: 60})}
            >
              Vista 3D
            </button>
            <button 
              className="control-btn" 
              onClick={() => map.current?.flyTo({zoom: 10, pitch: 0})}
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
          max-width: 300px;
          backdrop-filter: blur(5px);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }
        
        .map-title h1 {
          margin: 0 0 5px 0;
          font-size: 1.4rem;
          color: #333;
          font-weight: 600;
        }
        
        .map-title p {
          margin: 0;
          font-size: 0.9rem;
          color: #666;
          line-height: 1.4;
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
        
        /* Estilos para el mapa en sí */
        .mapboxgl-canvas {
          border-radius: 0;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .map-overlay {
            padding: 15px;
          }
          
          .map-title {
            max-width: 100%;
            padding: 12px 15px;
          }
          
          .map-title h1 {
            font-size: 1.2rem;
          }
          
          .map-controls {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
};