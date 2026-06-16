import { toNodeHandler } from 'srvx/node';
import server from '../dist/server/server.js';

export default toNodeHandler(server.fetch);
