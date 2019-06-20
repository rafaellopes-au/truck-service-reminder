//var spfile = require("./spDownloadFile");
require('dotenv').config()
var sppull = require("sppull").sppull;
const readXlsxFile = require('read-excel-file/node');
const mysql = require('mysql');
const func = require('./functions')


exports.clientsData = function () {
var context = {
  siteUrl: process.env.spSiteUrl,
  creds: {
    username: process.env.spCredUsername,
    password: process.env.spCredPassword
  }
};


var options = {
  spRootFolder: process.env.spOptionSpRootFolder,
  dlRootFolder: process.env.spOoptionDlRootFolder,
  strictObjects: [process.env.spOptionStrictObjects]
};

/*
 * All files will be downloaded from http://contoso.sharepoint.com/subsite/Shared%20Documents/Contracts folder
 * to __dirname + /Downloads/Contracts folder.
 * Folders structure will remain original as it is in SharePoint's target folder.
*/
sppull(context, options)
  .then(function(downloadResults) {
    func.logme(1, "XLSx File is downloaded",true)
    console.log("Files are downloaded");
    console.log("For more, please check the results");

    var date = new Date().toLocaleString();

    console.log("reading file...")
    func.logme(0, "Start reading file", true)
        // File path.
        readXlsxFile('./Downloads/JOB ALLOCATION - MASTER LIST.xlsx', { sheet: 1, password: "dawnruth" })
        .then((rows) => {
          var connection = mysql.createConnection({
            host     : process.env.mySqlHost,
            user     : process.env.mySqlUser,
            password : process.env.mySqlPassword,
            database : process.env.mySqlDatabase
          });

          connection.connect();
          console.log("Connection created")

          var strDelete = `delete from tbJobAllocation`
          func.logme(2, "TbJobAllocation data was deleted")
          connection.query(strDelete, (err,rows) => {if(err) throw err;})

          var funcs = []
          function funcInsert(job, customer, email, contact, phone) {
            return function() {

              if (email != null) {
                  var strInsert = `Insert into tbJobAllocation (job, customer, email, contact, mobile) `
                      strInsert += `values ("${job.substring(1, 4)}", "${customer}", "${email}", "${contact}", "${phone}")`
                  //console.log(strInsert + " email:"+email)
                  connection.query(strInsert, (err,rows) => {if(err) {
                    func.logme(4, `SQL Failed: Job:${job}, Customer:${customer}, Contact:${email}, Email:${contact}, Mobile:${phone}`,true)
                    throw err;}
                  })
              } else {
                func.logme(2, `Invalid email: Job:${job}, Customer:${customer}, Contact:${email}, Email:${contact}, Mobile:${phone}`)
              }
            }
          }

          for (var i = 2; i < rows.length; i++) {
            if (rows[i][0] != "" || rows[i][8] != "" ) {
                funcs[i] = funcInsert(rows[i][0], rows[i][7], rows[i][8], rows[i][9], rows[i][13]);
            }   else {                   //Job,        Customer,   Email,      Contact,    Phone
                func.logme(2, `Row ${i} is missing data: Job:${rows[i][0]}, Customer:${rows[i][7]}, Contact:${rows[i][9]}, Email:${rows[i][8]}, Mobile:${rows[i][13]}`,true)
            }
          }
          for (var j = 2; j < rows.length; j++) {
            funcs[j]();
          }
        })
        .catch(function(err) {
           func.logme(4, "Can't read XLSs File",true)
           console.log("Core error has happened", err);
        });

  })
  .catch(function(err) {
    func.logme(4, "Can't download file",true)
    console.log("Core error has happened", err);
  });
  return "clientsData";
}
