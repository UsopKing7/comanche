import { Pool } from 'pg'
import env from 'dotenv'
import { DATABASE_URL } from './env'
import dns from 'node:dns/promises'

env.config()

// Render forces IPv6 sometimes → break Supabase
dns.setDefaultResultOrder('ipv4first')

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

export const connectionDB = async () => {
  try {
    await pool.connect()
    console.log('Conectado a la base de datos')
  } catch (error) {
    console.log('[-]', error)
  }
}
