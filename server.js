const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

let keywords = [];

app.post('/save', (req, res) => {
    const data = req.body;
    keywords.push(data);
    res.sendStatus(200);
});

app.get('/keywords', (req, res) => {
    res.json(keywords);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
