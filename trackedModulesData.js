var GoogleSpreadsheet = require('google-spreadsheet');
var creds = require('./client_secret.json');
const mysql = require('mysql');
require('dotenv').config()
const func = require('./functions')

exports.trackedModulesData = function() {
// Create a document object using the ID of the spreadsheet - obtained from its URL.
var doc = new GoogleSpreadsheet(process.env.spreadsheetId);

//Connect MySql database
 // var dbConfig = {
 //   host:  process.env.mySqlHost,
 //   user: process.env.mySqlUser,
 //   password: process.env.mySqlPassword,
 //   database: process.env.mySqlDatabase
 // }
var date = new Date().toLocaleString();

 var mysql      = require('mysql');
 var connection = mysql.createConnection({
   host     : process.env.mySqlHost,
   user     : process.env.mySqlUser,
   password : process.env.mySqlPassword,
   database : process.env.mySqlDatabase
 });

 connection.connect();



// Authenticate with the Google Spreadsheets API.
doc.useServiceAccountAuth(creds, function (err) {

  // Get all of the rows from the spreadsheet.
  doc.getRows(1, function (err, rows) {

    var funcs = [];

    function createfunc(i, maxLength) {
      return function() {

        if (rows[i].assetregistration !== "" ) {
        //console.log("My value: " + rows[i].assetenginehours);

        var sqlString = `SELECT assetregistration, assetenginehours FROM tbEngineHours where assetregistration = "${rows[i].assetregistration}"`
        connection.query(sqlString, (err,mySqlrows) => {
        if(err) throw err;
            if (mySqlrows.length == 0){
              var sqlInsertString = `Insert into tbEngineHours (assetmodel, assetregistration, assetenginehours, assetlocation, latitude, longitude, lastupdate, assetmake) values  ("${rows[i].assetmodel.replace(/\s/g, '')}","${rows[i].assetregistration}",${rows[i].assetenginehours}, "${rows[i].assetlocation}", "${rows[i].latitude}", "${rows[i].longitude}", "${date}", "${rows[i].assetmake}")`
              connection.query(sqlInsertString, (err,rows) => {if(err) throw err;
              //func.logme(2, `New Module: [Registration: ${rows[i].assetregistration}, Engine Hours: ${rows[i].assetenginehours}], Model: ${rows[i].assetmodel.replace(/\s/g, '')}`)
               if(i == (maxLength-1)) {connection.destroy();
               func.logme(1, "Google Spreadsheet data updated",true)
                }
              });
            } else {
              var sqlUpdateString = `UPDATE tbEngineHours SET assetmodel="${rows[i].assetmodel}", assetenginehours=${rows[i].assetenginehours},  assetlocation="${rows[i].assetlocation}", latitude="${rows[i].latitude}", longitude="${rows[i].longitude}", lastupdate="${date}" , assetmake="${rows[i].assetmake}" WHERE assetregistration = "${rows[i].assetregistration}"`
              func.logme(2, `Module Updated: [Registration: ${rows[i].assetregistration}, Engine Hours: ${rows[i].assetenginehours}, Model: ${rows[i].assetmodel.replace(/\s/g, '')}]`)
              connection.query(sqlUpdateString, (err,rows) => {if(err) throw err;
                 if(i == (maxLength-1)) {connection.destroy();
                 func.logme(1, "Google Spreadsheet data updated",true)}
              })
            }


        })
      }
      }
    }

    for (var i = 0; i < rows.length; i++) {
      funcs[i] = createfunc(i, rows.length);
    }

    for (var j = 0; j < rows.length; j++) {
      // and now let's run each one to see
      funcs[j]();
    }

  });
});
}
