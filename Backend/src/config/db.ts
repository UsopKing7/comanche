import { Pool } from 'pg'
import env from 'dotenv'
import { DATABASE_URL } from './env'

env.config()

export const pool = new Pool({
  connectionString: DATABASE_URL
})

export const connectionDB = async () => {
  try {
    await pool.connect()
    console.log('Conectado a la base de datos')
  } catch (error) {
    console.log('[-]', error)
  }
}
