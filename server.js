require('dotenv').config()
const modulesdata = require('./trackedModulesData')
const sendalert = require('./sendAlertModule')
const clients = require('./clientsData')
const func = require('./functions')
const download = require('download-file')


const express = require('express')
const app = express()

app.get('/trackedModulesData', function (req, res) {
  func.logme(2, "Start reading Google Spreadsheet",true)
  modulesdata.trackedModulesData();
  res.send(">Tracked Modules Data just started!")
})

app.get('/sendAlertModule', function (req, res) {
  var msg = sendalert.sendAlertModule();
  console.log(msg)
  res.send(">"+ msg)
})

app.get('/clientsData', function (req, res) {
  func.logme(2, "Start SharePoint XLSX file function",true)
  clients.clientsData();
  res.send(">Clients Data just started!")
})

app.get('/log/:day/:month/:year/', function (req, res) {

    var url = `http://stg.log/log-${req.params.year}-${req.params.month}-${req.params.day}.txt`

    var options = {
        directory: "./log/",
        filename: `log-${req.params.year}-${req.params.month}-${req.params.day}.txt`
    }

    download(url, options, function(err){
        if (err) throw err
        console.log("download log")
    })
})


app.listen(8080)
