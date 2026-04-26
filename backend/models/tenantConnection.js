const mongoose = require('mongoose');

/**
 * Gestiona conexiones a bases de datos separadas por Gym (Tenant).
 * Patrón: cada Gym tiene su propia DB en el mismo cluster MongoDB.
 * DB Name: couch_chuchis_<gymId>
 */

const tenantConnections = {}; // Cache de conexiones activas

const getTenantConnection = async (gymId) => {
  if (!gymId) throw new Error('gymId es requerido para conexión multi-tenant');

  // Retornar conexión cacheada si ya existe y está activa
  if (tenantConnections[gymId] && tenantConnections[gymId].readyState === 1) {
    return tenantConnections[gymId];
  }

  const baseUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
  // Build URI with tenant-specific DB name (strip existing DB name from Atlas URI)
  const uriBase = baseUri.includes('?')
    ? baseUri.substring(0, baseUri.indexOf('?'))
    : baseUri;
  const uriParams = baseUri.includes('?') ? baseUri.substring(baseUri.indexOf('?')) : '';
  
  // Limpiar el path de la DB base y reemplazar con el tenant
  const uriParts = uriBase.split('/');
  uriParts[uriParts.length - 1] = `couch_chuchis_${gymId.replace(/-/g, '_')}`;
  const tenantUri = uriParts.join('/') + uriParams;

  try {
    const connection = await mongoose.createConnection(tenantUri);
    tenantConnections[gymId] = connection;
    console.log(`🏋️ Tenant DB conectada: couch_chuchis_${gymId}`);
    return connection;
  } catch (error) {
    console.error(`❌ Error conectando tenant ${gymId}:`, error.message);
    throw error;
  }
};

/**
 * Retorna un modelo Mongoose dentro de la conexión del tenant específico.
 * @param {string} gymId - ID del gimnasio (tenant)
 * @param {string} modelName - Nombre del modelo, ej. 'ClientState'
 * @param {mongoose.Schema} schema - Schema de Mongoose a usar
 */
const getTenantModel = async (gymId, modelName, schema) => {
  const conn = await getTenantConnection(gymId);
  // Evitar recompilar modelos que ya existen en esta conexión
  if (conn.models[modelName]) return conn.models[modelName];
  return conn.model(modelName, schema);
};

module.exports = { getTenantConnection, getTenantModel };
