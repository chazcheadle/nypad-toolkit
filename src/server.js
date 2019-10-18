import express from 'express';
import bodyParser from "body-parser";
import path from 'path';

const port = process.env.PORT || 3000;

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static('dist'))
app.use('/js', express.static(path.join(__dirname + 'js')));
app.use('/css', express.static(path.join(__dirname + 'css')));


app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.listen(port, function () {
    console.log(`Example app listening on port ${port}`);
});