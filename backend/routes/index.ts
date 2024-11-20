import { Hono } from "hono"
import user from './users'
import blog from './blogs'

const api = new Hono();

api.route('/user',user);
api.route('/blog',blog)


export default api