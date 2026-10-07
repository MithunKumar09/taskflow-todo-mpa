import { loadEnvironment, readEnvironment } from '../apps/api/src/config/env.js';
loadEnvironment();
readEnvironment();
console.log('Startup configuration is valid.');
