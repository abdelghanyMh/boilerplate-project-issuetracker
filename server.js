'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./db-connection');
const bodyParser = require('body-parser');
const expect = require('chai').expect;
const cors = require('cors');
const apiRoutes = require('./routes/api.js');
const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner');

let app = express();

app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({ origin: '*' })); //For FCC testing purposes only


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Sample front-end
app.route('/:project/')
    .get(function(req, res) {
        res.sendFile(process.cwd() + '/views/issue.html');
    });

//Index page (static HTML)
app.route('/')
    .get(function(req, res) {
        res.sendFile(process.cwd() + '/views/index.html');
    });

//For FCC testing purposes
fccTestingRoutes(app);

myDB(async(client) => {
    const myDataBase = await client.db('FFC_ISSUE_TRACKER').collection('projects');

    //For FCC testing purposes
    fccTestingRoutes(app, myDataBase);


    //Routing for API 
    apiRoutes(app, myDataBase);

}).catch((e) => {
    app.route('/').get((req, res) => {
        res.send(`${e}, message: 'Unable to login' `);
    });
});







//Start our server and tests!
app.listen(process.env.PORT || 3000, function() {
    console.log("Listening on port " + process.env.PORT);
    if (process.env.NODE_ENV === 'test') {
        console.log('Running Tests...');
        setTimeout(function() {
            try {
                runner.run();
            } catch (e) {
                let error = e;
                console.log('Tests are not valid:');
                console.log(error);
            }
        }, 3500);
    }
});

module.exports = app; //for testing