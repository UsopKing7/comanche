import { Request, Response } from 'express'
import { pool } from '../config/db'

export const coordPuyas = async (_req: Request, res: Response) => {
try {
    const query = `
      SELECT id, fid, ST_AsGeoJSON(ST_Transform(geom, 4326))::json AS geometry
      FROM "ConteoPuyas";
    `;
    const result = await pool.query(query);

    // Formatear como FeatureCollection
    const geojson = {
      type: "FeatureCollection",
      features: result.rows.map((row: any) => ({
        type: "Feature",
        geometry: row.geometry,
        properties: {
          id: row.id,
          fid: row.fid,
        },
      })),
    };

    res.json(geojson);
  } catch (error) {
    console.error("Error al obtener puyas:", error);
    res.status(500).send("Error en el servidor");
  }
}