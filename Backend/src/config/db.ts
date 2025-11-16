import { Pool } from 'pg'
import env from 'dotenv'

env.config()

export const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  ssl: {
    rejectUnauthorized: false
  }
})

export const connectionDB = async () => {
  try {
    await pool.connect()
    console.log('Conectado a la base de datos')
  } catch (error) {
    console.log('[-]', error)
  }
}
