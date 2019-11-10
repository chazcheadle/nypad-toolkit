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
    console.log('in insert');
    return db('user_edits')
        .insert({
            name,
            geometry: st.setSRID(st.geomFromText(feature), 26918)
        })
        .then((result) => {
            console.log(result);
            return result;
        })
        .catch((e) => {
            console.log('TRANSACTION ERROR');
            console.log(e);
        });
}


const transaction = (req, res) => {
    const {
        action,
        description = '',
        name,
    } = req.body;
    
    console.log(`${action}: ${name} - ${description}`);
    let result;
    switch (action) {
        case 'insert': {
           insertFeature(req.body)
               .then(() => {
                   console.log('INSERTED');
                    res.send('Inserted')
                });
            break;
        }
        default:
            break;

    }
    // res.send('OK');
}

export { transaction }