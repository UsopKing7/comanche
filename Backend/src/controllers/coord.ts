import { Request, Response } from 'express'
import { pool } from '../config/db'

export const coordPuyas = async (_req: Request, res: Response) => {
  try {
    const query = `
      SELECT id, fid, ST_AsGeoJSON(ST_Transform(geom, 4326))::json AS geometry
      FROM "ConteoPuyas"
    `
    const result = await pool.query(query)

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
    }

    res.json(geojson)
  } catch (error) {
    console.error("Error al obtener puyas:", error)
    res.status(500).send("Error en el servidor")
  }
}

export const puyas_info = async (_req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        p.id, 
        p.conteopuyas_id, 
        p.nombre_cientifico, 
        p.nombre_comun,
        p.edad_estimada, 
        p.estado_floracion, 
        p.observaciones,
        ST_AsGeoJSON(ST_Transform(c.geom, 4326))::json AS geometry
      FROM "ConteoPuyas" c
      JOIN "puyas_info" p ON c.id = p.conteopuyas_id;
    `
    const result = await pool.query(query)

    const geojson = {
      type: "FeatureCollection",
      features: result.rows.map((row: any) => ({
        type: "Feature",
        geometry: row.geometry,
        properties: {
          id: row.id,
          fid: row.conteopuyas_id,
          nombre_cientifico: row.nombre_cientifico,
          nombre_comun: row.nombre_comun,
          edad_estimada: row.edad_estimada,
          estado_floracion: row.estado_floracion,
          observaciones: row.observaciones,
        },
      })),
    }

    return res.json(geojson)
  } catch (error) {
    console.error("Error en puyas_info:", error)
    return res.status(500).send("Error en el servidor");
  }
}

export const tracker = async (_req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        id,
        name,
        description,
        ST_AsGeoJSON(ST_Transform(geom, 4326))::json AS geometry
      FROM "doc — track"
    `
    
    const result = await pool.query(query)

    const geojson = {
      type: "FeatureCollection",
      features: result.rows.map((row: any) => ({
        type: "Feature",
        geometry: row.geometry,
        properties: {
          id: row.id,
          name: row.name,
          description: row.description,
        },
      })),
    }

    return res.status(200).json(geojson)
  } catch (error) {
    console.error("Error en tracker:", error)
    return res.status(500).send("Error en el servidor")
  }
}