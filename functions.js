var fs = require('file-system');
require('dotenv').config()

exports.logme = function (status, msg, showDate){

  var d = new Date();

  var currentMonth = d.getMonth()+1;
  if (currentMonth<10) {
    currentMonth = "0"+currentMonth
  }

  var currentDay = d.getDay();
  currentDay += currentDay

  if (currentDay<10) {
    currentDay = "0"+currentDay
  }

  const logFileName = `./log/log-${d.getFullYear()}-${currentMonth}-${currentDay}.txt`;


    let date = "";
    if(showDate == true){
      date = new Date().toLocaleString() + " > ";
    }
    let dsStatus;
    switch(status){
      case 0:
        dsStatus = "[Warning]";
        break;
      case 1:
        dsStatus = "[Success]";
        break;
      case 2:
        dsStatus = "[Inform] ";
        break;
      case 3:
        dsStatus = "[Warning]";
        break;
      case 4:
        dsStatus = "[Error]  ";
        break;
      default:
        dsStatus = "[LogErr] ";
    }

    string = `${dsStatus} ${date}${msg} \n`
    fs.appendFile(logFileName, string, function(err) {})
}

exports.showlog = function (day, month, year) {
  const logFileName = `./log/log-${year}-${month}-${day}.txt`;

  fs.readFile(logFileName, (err, data) => {
  if (err) throw err;
  return data
});

}
