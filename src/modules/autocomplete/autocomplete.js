import knex from 'knex';

require("dotenv").config();

const db = knex({
  client: "pg",
  connection: process.env.DB_SERVER || '',
  searchPath: ["knex", "public"],
  ssl: true
});

/**
 * Autocomplete callback
 */
const getAutocompleteSuggestions = (req) => {
    const limitVal = req.query.limit || 25;
    if (!req.query.q) {
        return;
    }
    return db
        .distinct('loc_nm as text', 'loc_nm as id')
        .from('nypad_2017')
        .where('loc_nm', 'ilike', `%${req.query.q}%`)
        .limit(limitVal)
        .then((rows) => {
            return {rows};
        })
        .catch((e) => {
            return {}
        });
}

const autocomplete = (req, res) => {
    getAutocompleteSuggestions(req)
        .then((records) => {
            if (records) {
                res.send({results: records.rows});
            }
        })
        .catch((e) => {
            return {}
        });
}

export { autocomplete }