import { app } from './server'
import { PORT } from './config/env'
import { connectionDB } from './config/db'

connectionDB()

app.listen(PORT, () => {
  console.table({
    URL: `http://localhost:${PORT}`
  })
})
