import knex from 'knex';
import redis from 'redis';

require("dotenv").config();

const db = knex({
  client: "pg",
  connection: process.env.DB_SERVER || '',
  searchPath: ["knex", "public"],
  ssl: true
});

// Set up redis
const redisClient = redis.createClient({ host: process.env.REDIS_HOST });

redisClient.on('connect', () => {
    console.log('Redis connected');
});

/**
 * County NYPAD summary callback
 * 
 * Retrieve:
 * - NYPAD feature count
 * - NYPAD feature total acreage
 * - mean acreage for features in county
 */
const getCountySummaryData = (req) => {
    if (!req.query.q) {
        // return;
    }

    return db
        .raw(`
            SELECT name,
                COUNT(nypad_id) total,
                CEIL(SUM(ST_Area(nypad_2017.wkb_geometry) * 0.00024711)) acres,
                CEIL(AVG(ST_Area(nypad_2017.wkb_geometry) * 0.00024711)) mean
            FROM nypad_2017, counties_shoreline
            WHERE (ST_Contains(counties_shoreline.wkb_geometry, nypad_2017.wkb_geometry)
                OR ST_Overlaps(counties_shoreline.wkb_geometry, nypad_2017.wkb_geometry))
                AND abbreviation = '${req.query.q}'
            GROUP BY name
            ORDER BY name`)
        .then((result) => {
            return (result.rows) ? {total: result.rows[0]} : {};
        })
        .catch((e) => {
            console.log(e);
            return {}
        });
}

/**
 * County NYPAD GAP statistics callback
 */
const getCountyGAPStatusData = (req) => {
    if (!req.query.q) {
        // return;
    }
    return db
        .raw(`
            SELECT gap_sts,
                COUNT(nypad_id) total,
                CEIL(SUM(ST_Area(nypad_2017.wkb_geometry) * 0.00024711)) acres,
                CEIL(AVG(ST_Area(nypad_2017.wkb_geometry) * 0.00024711)) mean
            FROM nypad_2017, counties_shoreline
            WHERE (ST_Contains(counties_shoreline.wkb_geometry, nypad_2017.wkb_geometry)
                OR ST_Overlaps(counties_shoreline.wkb_geometry, nypad_2017.wkb_geometry))
                AND abbreviation = '${req.query.q}'
            GROUP BY gap_sts
            ORDER BY gap_sts`)
        .then((result) => {
            return (result.rows) ? {gap_status: result.rows} : {};
        })
        .catch((e) => {
            console.log(e);
            return {}
        });
}

/**
 * Warm the Redis cache with County data.
 */
const countyDataWarmCache = async() => {

    await db
        .select('abbreviation')
        .from('counties_shoreline')
        .then((result) => {
            if (result) {
                console.log(result);
                result.map(r)
            }
            else {
                console.log('boo');
            }
        });
}

const retrieveCountyData = (req, res) => {
    const county = req.query.q;
    redisClient.get(`county:${county}`, async (error, cachedData) => {
        if (cachedData) {
            console.log(`CACHE HIT: county:${county}`);
            res.send(JSON.parse(cachedData));
        } else {
            try {
                console.log(`CACHE MISS: county:${county}`);
                Promise.all([getCountySummaryData(req), getCountyGAPStatusData(req)])
                    .then((results) => {
                        const data = results.reduce((result, current) => {
                                return Object.assign(result, current);
                            }, {});
                        console.log(`CACHE FILL: county:${county}`);
                        redisClient.set(`county:${county}`, JSON.stringify(data));
                        res.send(data);
                    });
            } catch (error) {
                console.log(error);
            }
        }
    });
}


const countyDataEndpoint = (req, res) => {

    if (req.query.action === 'warmcache') {
        console.log('warm the cache!');
        countyDataWarmCache();
    }

    if (!req.query.q) {
        return;
    }
    else {
        retrieveCountyData(req, res);
    }
    
}

export { countyDataEndpoint }