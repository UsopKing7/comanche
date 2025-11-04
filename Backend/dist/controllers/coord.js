"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.curva5s = exports.curva20s = exports.tracker = exports.puyas_info = exports.coordPuyas = void 0;
const db_1 = require("../config/db");
const coordPuyas = async (_req, res) => {
    try {
        const query = `
      SELECT id, fid, ST_AsGeoJSON(ST_Transform(geom, 4326))::json AS geometry
      FROM "ConteoPuyas"
    `;
        const result = await db_1.pool.query(query);
        const geojson = {
            type: "FeatureCollection",
            features: result.rows.map((row) => ({
                type: "Feature",
                geometry: row.geometry,
                properties: {
                    id: row.id,
                    fid: row.fid,
                },
            })),
        };
        res.json(geojson);
    }
    catch (error) {
        console.error("Error al obtener puyas:", error);
        res.status(500).send("Error en el servidor");
    }
};
exports.coordPuyas = coordPuyas;
const puyas_info = async (_req, res) => {
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
    `;
        const result = await db_1.pool.query(query);
        const geojson = {
            type: "FeatureCollection",
            features: result.rows.map((row) => ({
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
        };
        return res.json(geojson);
    }
    catch (error) {
        console.error("Error en puyas_info:", error);
        return res.status(500).send("Error en el servidor");
    }
};
exports.puyas_info = puyas_info;
const tracker = async (_req, res) => {
    try {
        const query = `
      SELECT 
        id,
        name,
        description,
        ST_AsGeoJSON(ST_Transform(geom, 4326))::json AS geometry
      FROM "doc — track"
    `;
        const result = await db_1.pool.query(query);
        const geojson = {
            type: "FeatureCollection",
            features: result.rows.map((row) => ({
                type: "Feature",
                geometry: row.geometry,
                properties: {
                    id: row.id,
                    name: row.name,
                    description: row.description,
                },
            })),
        };
        return res.status(200).json(geojson);
    }
    catch (error) {
        console.error("Error en tracker:", error);
        return res.status(500).send("Error en el servidor");
    }
};
exports.tracker = tracker;
const curva20s = async (_req, res) => {
    try {
        const result = await db_1.pool.query(`
      SELECT 
        id, 
        contour, 
        inline_fid, 
        ST_AsGeoJSON(ST_Transform(geom, 4326)) AS geometry
      FROM "curvas20s";
    `);
        // Convertir a GeoJSON válido
        const geoJSON = {
            type: "FeatureCollection",
            features: result.rows.map(row => ({
                type: "Feature",
                properties: {
                    id: row.id,
                    contour: row.contour,
                    inline_fid: row.inline_fid
                },
                geometry: JSON.parse(row.geometry) // IMPORTANTE: parsear el string GeoJSON
            }))
        };
        // devolver como GeoJSON
        return res.json(geoJSON);
    }
    catch (error) {
        console.error(error);
        return res.status(500).send("Error en el servidor");
    }
};
exports.curva20s = curva20s;
const curva5s = async (_req, res) => {
    try {
        const result = await db_1.pool.query(`
      SELECT 
        id, 
        contour, 
        inline_fid, 
        ST_AsGeoJSON(ST_Transform(geom, 4326)) AS geometry
      FROM "curvas5s";
    `);
        // Convertir a GeoJSON válido
        const geoJSON = {
            type: "FeatureCollection",
            features: result.rows.map(row => ({
                type: "Feature",
                properties: {
                    id: row.id,
                    contour: row.contour,
                    inline_fid: row.inline_fid
                },
                geometry: JSON.parse(row.geometry)
            }))
        };
        // devolver como GeoJSON
        return res.json(geoJSON);
    }
    catch (error) {
        console.error(error);
        return res.status(500).send("Error en el servidor");
    }
};
exports.curva5s = curva5s;
//# sourceMappingURL=coord.js.map