import express from 'express';
import bodyParser from "body-parser";
import cors from 'cors';
import path from 'path';
import responseTime from 'response-time';

import { autocomplete } from './modules/autocomplete/autocomplete';
import { countyDataEndpoint } from './modules/countyData/countyData';

require("dotenv").config();

if (!process.env.DB_SERVER) {
    process.exit(1);
}

const port = process.env.PORT || 3000;

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(responseTime())

app.use(express.static('dist'))
app.use('/js', express.static(path.join(__dirname + 'js')));
app.use('/css', express.static(path.join(__dirname + 'css')));


app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

// Return matching text strings for the autocomplete search box.
app.get('/autocomplete', (req, res) => {
    autocomplete(req, res);
});

// Retrieve NYPAD data for a county
app.get('/county_data', (req, res) => {
    countyDataEndpoint(req, res);
});

app.listen(port, function () {
    console.log(`NYPAD Toolkit server listening on port ${port}`);
});