import knex from 'knex';

require("dotenv").config();

const db = knex({
  client: "pg",
  connection: process.env.DB_SERVER || '',
  searchPath: ["knex", "public"],
  ssl: true
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

const countyDataEndpoint = (req, res) => {
    Promise.all([getCountySummaryData(req), getCountyGAPStatusData(req)])
        .then((results) => {
            res.send(results.reduce((result, current) => {
                return Object.assign(result, current);
              }, {}));
        });
}

export { countyDataEndpoint }