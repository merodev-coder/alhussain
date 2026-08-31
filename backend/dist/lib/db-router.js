import { getConnection, getAllConnections, getConnectionCount } from './db.js';
import { logError, logInfo, logWarn } from './logger.js';
export function isStorageFullError(error) {
    // Primary check: MongoDB Atlas error code 8000 (space quota exceeded)
    if (typeof error === 'object' && error !== null) {
        const errorObj = error;
        if (errorObj.code === 8000 || errorObj.codeName === 'AtlasError') {
            return true;
        }
    }
    // Secondary fallback: message text check (in case driver wraps error differently)
    if (error instanceof Error && error.message) {
        return error.message.toLowerCase().includes('over your space quota');
    }
    return false;
}
function logFullError(error, context) {
    if (typeof error === 'object' && error !== null) {
        const errorObj = error;
        logError(context, `Error details - code: ${errorObj.code}, codeName: ${errorObj.codeName}, name: ${errorObj.name}, message: ${errorObj.message}`);
    }
    else {
        logError(context, `Error details (non-object): ${String(error)}`);
    }
}
export class DatabaseRouter {
    /**
     * Create: sequential fill with storage-quota failover.
     * Always starts at dbIndex 0, only moves to dbIndex 1, 2, etc. on storage-quota errors.
     * `modelCreator` receives the connection AND the index so the caller can stamp dbIndex.
     */
    static async createWithFailover(modelCreator, recordType) {
        const connectionCount = getConnectionCount();
        // Sequential fill: always start at dbIndex 0, then 1, 2, etc. on storage-quota errors
        for (let dbIndex = 0; dbIndex < connectionCount; dbIndex++) {
            try {
                const connection = getConnection(dbIndex);
                logInfo('DatabaseRouter', `Attempting ${recordType} creation on database index ${dbIndex}`);
                const result = await modelCreator(connection, dbIndex);
                logInfo('DatabaseRouter', `Created ${recordType} on database index ${dbIndex}`);
                return { result, dbIndex };
            }
            catch (error) {
                logFullError(error, `DatabaseRouter write attempt ${dbIndex} for ${recordType}`);
                if (isStorageFullError(error) && dbIndex < connectionCount - 1) {
                    logWarn('DatabaseRouter', `Database index ${dbIndex} storage full (code 8000/AtlasError detected), trying next database for ${recordType}`);
                    continue;
                }
                logError('DatabaseRouter', `Failed to create ${recordType} on database ${dbIndex}: ${error}`);
                throw error;
            }
        }
        throw new Error(`Failed to create ${recordType} on any database (all may be full)`);
    }
    static async readAcrossAllDatabases(modelReader, recordType) {
        const connections = getAllConnections();
        logInfo('DatabaseRouter', `Reading ${recordType} across ${connections.length} database(s)`);
        const resultsArrays = await Promise.all(connections.map(async (connection, index) => {
            try {
                const results = await modelReader(connection, index);
                logInfo('DatabaseRouter', `Found ${results.length} ${recordType} in database index ${index}`);
                return results;
            }
            catch (error) {
                logError('DatabaseRouter', `Failed to read ${recordType} from database ${index}: ${error}`);
                return [];
            }
        }));
        const allResults = resultsArrays.flat();
        logInfo('DatabaseRouter', `Total ${recordType} across all databases: ${allResults.length}`);
        return allResults;
    }
    static async updateOnDatabase(dbIndex, modelUpdater, recordType) {
        try {
            const connection = getConnection(dbIndex);
            logInfo('DatabaseRouter', `Updating ${recordType} on database index ${dbIndex}`);
            return await modelUpdater(connection);
        }
        catch (error) {
            logFullError(error, `DatabaseRouter update on database ${dbIndex} for ${recordType}`);
            logError('DatabaseRouter', `Failed to update ${recordType} on database ${dbIndex}: ${error}`);
            throw error;
        }
    }
    static async deleteFromDatabase(dbIndex, modelDeleter, recordType) {
        try {
            const connection = getConnection(dbIndex);
            logInfo('DatabaseRouter', `Deleting ${recordType} from database index ${dbIndex}`);
            return await modelDeleter(connection);
        }
        catch (error) {
            logError('DatabaseRouter', `Failed to delete ${recordType} from database ${dbIndex}: ${error}`);
            throw error;
        }
    }
    static async findByIdAcrossDatabases(id, modelFinder, recordType) {
        const connections = getAllConnections();
        for (let i = 0; i < connections.length; i++) {
            try {
                const result = await modelFinder(connections[i], id);
                if (result) {
                    logInfo('DatabaseRouter', `Found ${recordType} ${id} in database index ${i}`);
                    return { result, dbIndex: i };
                }
            }
            catch (error) {
                logError('DatabaseRouter', `Error searching ${recordType} ${id} in database ${i}: ${error}`);
            }
        }
        logWarn('DatabaseRouter', `${recordType} ${id} not found in any database`);
        return null;
    }
    /**
     * Get database status for debugging - checks connection health and counts
     */
    static async getDatabaseStatus() {
        const connections = getAllConnections();
        const status = [];
        for (let i = 0; i < connections.length; i++) {
            try {
                const connection = connections[i];
                const collections = ['products', 'orders', 'addons', 'accessories', 'specOptions', 'pricelists', 'shippingRates', 'inventoryLogs'];
                const counts = {};
                for (const collection of collections) {
                    try {
                        const count = await connection.collection(collection).countDocuments();
                        counts[collection] = count;
                    }
                    catch {
                        counts[collection] = 0;
                    }
                }
                status.push({
                    index: i,
                    alive: connection.readyState === 1, // 1 = connected
                    collections: counts,
                });
            }
            catch (error) {
                status.push({
                    index: i,
                    alive: false,
                    collections: {},
                });
            }
        }
        return status;
    }
}
