import knex from 'knex';
import knexPostgis from 'knex-postgis';

require("dotenv").config();

const db = knex({
  client: "pg",
  connection: process.env.DB_SERVER || '',
  dialect: 'postgis',
  searchPath: ["knex", "public"],
  ssl: true
});

knexPostgis(db);
const st = db.postgis;
/**
*/
// const getAutocompleteSuggestions = (req) => {
//     if (!req.query.q) {
//         return;
//     }
//     return db
//         .distinct('loc_nm as text', 'loc_nm as id')
//         .from('nypad_2017')
//         .where('loc_nm', 'ilike', `%${req.query.q}%`)
//         .limit(limitVal)
//         .then((rows) => {
//             return {rows};
//         })
//         .catch((e) => {
//             return {}
//         });
// }

const insertFeature = (data) => {

    const {
        description = '',
        email = '',
        feature = '',
        name,
    } = data;

    return db('user_edits')
        .insert({
            name,
            wkb_geometry: st.setSRID(st.geomFromText(feature), 26918)
        })
        .then((result) => {
            console.log(result);
            return result;
        })
        .catch((e) => {
            console.log('EEEEEEEEE');
            console.log(e);
            res.status(500);
        });
}


const transaction = async(req, res) => {
    const {
        action,
        description = '',
        name,
    } = req.body;
    
    console.log(`${action}: ${name} - ${description}`);
    let result;
    switch (action) {
        case 'insert': {
            result = await insertFeature(req.body);
        }
        default:

    }
    console.log('###########');
    console.log(result);
    res.send('OK');
}

export { transaction }