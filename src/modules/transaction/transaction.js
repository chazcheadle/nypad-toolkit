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

const insertFeature = (data) => {

    const {
        feature = '',
        name,
    } = data;
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
            console.log('Data:');
            console.log(data);
        });
}

const transaction = (req, res) => {
    const {
        action,
        description = '',
        feature,
        name,
    } = req.body;
    
    console.log(`${action}: ${name} - ${description} - ${feature}`);
    switch (action) {
        case 'insert': {
           insertFeature(req.body)
               .then((result) => {
                   console.log(`Inserted: ${name}`);
                    res.send('Inserted')
                });
            break;
        }
        default:
            break;

    }
}

export { transaction }