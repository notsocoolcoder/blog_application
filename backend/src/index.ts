import { Hono } from 'hono'
import api from '../routes/index'


const app = new Hono()

app.route('/api/v1',api )

export default app
