require('dotenv').config()
const mysql = require('mysql');

exports.sendAlertModule = function() {

  var mysql      = require('mysql');
  var connection = mysql.createConnection({
    host     : process.env.mySqlHost,
    user     : process.env.mySqlUser,
    password : process.env.mySqlPassword,
    database : process.env.mySqlDatabase
  });

  connection.connect();

function reminderStep(targetHr, currentHr){
  if (currentHr < (targetHr*0.85)) {
    return 1
  } else if (currentHr < (targetHr*0.90)) {
    return 2
  } else if (currentHr < targetHr) {
    return 3
  } else {
    return 4
  }
}

var funcSelectTarget = [];
var funcCheckServiceAlert = [];

var sqlString = `SELECT * FROM tbHoursAlert order by enginehours`
connection.query(sqlString, (err,harows) => {
    if(err) throw err;

    function createfuncSelectTarget(i) {
      return function() {

        var sqlEHours = `SELECT * FROM tbEngineHours where assetenginehours between ${harows[i].enginehours * 0.80} and  ${harows[i].enginehours * 1.15}`
        connection.query(sqlEHours, (err,ehrows) => {

          if(err) throw err


          function createCheckServiceAlert(k, i) { //ehrows //harows
            return function() {
              function registerServiceAlert(registration, enginehours, idhoursalert, alertName, reminder, address, modulename, latitude, longitude) {

                //get client data in tbJobAllocation
                var sqlJAllocation = `SELECT * FROM tbJobAllocation where job="${registration}" or job="${registration.replace("STG", "")}"`
                connection.query(sqlJAllocation, (err,jarows) => {

                if(err) throw err

                if(jarows!='') {
                  var {email, contact, mobile, customer } = jarows[0]

                  //create Html Body
                  var bodyhtml = `<p><br />Hi&nbsp;<strong>${contact}</strong>,</p>
                  <p>You are listed as the ${customer} contact for STG Global, we are emailing to notify you that your truck&nbsp;<strong>${modulename}</strong>&nbsp;has done&nbsp;<strong>${enginehours}&nbsp;hours</strong> and is nearly due for a service. To book a service at one of our convenient locations across Australia, to arrange a booking click below the most convenient location to schedule your service.</p>
                  <ul>
                  <li><a href='${process.env.urlFormGoldCoast}'>Gold Coast</a></li>
                  <li><a href='${process.env.urlFormSydney}'>Sydney</a></li>
                  <li><a href='${process.env.urlFormMelbourne}'>Melbourne</a></li>
                  <li>or Call 1300 998 784</li>
                  </ul>
                  <p><strong>Last known location&nbsp;</strong><strong>${modulename}</strong></p>
                  <div><img src='https://maps.googleapis.com/maps/api/staticmap?center=${address}&amp;zoom=13&amp;size=600x300&amp;maptype=roadmap&amp;markers=color:blue%7C${latitude},${longitude}&amp;key=${process.env.googlekey}' alt='' width='600' height='300' /></div>`

                  //insert data in tbServiceAlert
                  var date = new Date().toLocaleString();
                  var sqlInsertString = `INSERT INTO tbServicesAlert (assetregistration, assetenginehours, idhoursalert, reminder, remindername, reminderdate, customer, contact, mobile, email,address,modulename, latitude,longitude,bodyhtml) VALUES `
                      sqlInsertString += `("${registration}",${enginehours},${idhoursalert},${reminder},"${alertName}","${date}","${customer}","${contact}","${mobile}","${email}","${address}","${modulename}","${latitude}","${longitude}","${bodyhtml}")`
                  console.log(sqlInsertString)
                  connection.query(sqlInsertString, (err,rows) => {if(err) throw err;})
                }
              })

              }

              var sqlSAlert = `SELECT * FROM tbServicesAlert where assetregistration = "${ehrows[k].assetregistration}" and idhoursalert = ${harows[i].id} order by reminder desc Limit 1`
              connection.query(sqlSAlert, (err,sarows) => {
                if(err) throw err

                if(sarows == '') {
                  //FirstReminder
                  registerServiceAlert(ehrows[k].assetregistration, ehrows[k].assetenginehours, harows[i].id, harows[i].description, reminderStep(harows[i].enginehours, ehrows[k].assetenginehours), ehrows[k].assetlocation, (ehrows[k].assetmake + " - " + ehrows[k].assetmodel), ehrows[k].latitude, ehrows[k].longitude)

                } else {
                  //It doesn't the first reminder
                  if (sarows[0].reminder != reminderStep(harows[i].enginehours, ehrows[k].assetenginehours) && sarows[0].scheduledto == null) {
                    //console.log(`${sarows[0].reminder} != ${reminderStep(harows[i].enginehours, ehrows[k].assetenginehours)} && ${sarows[0].scheduledto} == null`)
                    registerServiceAlert(ehrows[k].assetregistration, ehrows[k].assetenginehours, harows[i].id,  harows[i].description, reminderStep(harows[i].enginehours, ehrows[k].assetenginehours), ehrows[k].assetlocation, (ehrows[k].assetmake + " - " + ehrows[k].assetmodel), ehrows[k].latitude, ehrows[k].longitude)
                  } else {
                    //console.log(`no ---> ${sarows[0].reminder} != ${reminderStep(harows[i].enginehours, ehrows[k].assetenginehours)} && ${sarows[0].scheduledto} == null`)
                  }
                }

              })
            }
          }


          for (var k = 0; k < ehrows.length; k++) {
            funcCheckServiceAlert[k] = createCheckServiceAlert(k, i);
          }

          for (var j = 0; j < ehrows.length; j++) {
            funcCheckServiceAlert[j]();
          }

        })
      }
    }

    // #1 Select tbHoursAlert
    for (var i = 0; i < harows.length; i++) {
      funcSelectTarget[i] = createfuncSelectTarget(i);
    }

    for (var j = 0; j < harows.length; j++) {
      funcSelectTarget[j]();
    }

})
return "sendAlertModules";
