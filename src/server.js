import express from 'express';
import bodyParser from "body-parser";
import cors from 'cors';
import path from 'path';

import { autocomplete } from './modules/autocomplete/autocomplete';

require("dotenv").config();

if (!process.env.DB_SERVER) {
    process.exit(1);
}

const port = process.env.PORT || 3000;

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static('dist'))
app.use('/js', express.static(path.join(__dirname + 'js')));
app.use('/css', express.static(path.join(__dirname + 'css')));


app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/autocomplete', (req, res) => {
    autocomplete(req, res);
});

app.listen(port, function () {
    console.log(`Example app listening on port ${port}`);
});