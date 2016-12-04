
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , firebase = require("firebase")
  , request = require('request');
var app = express();

firebase.initializeApp({
  serviceAccount: "FILENAME",
  databaseURL: "DB_URL"
});


var db = firebase.database();
var ref = db.ref("botChatItems");
function sendMessaggeToUser(data,userContact,sender){
   var fbRef=db.ref("chatItems/"+userContact.substr(1));
   var nnodeRef=fbRef.push();
   nnodeRef.set({
     "sender":sender,
     "receiver":userContact,
     "is_bot":true,
     "type":"text",
     "content":data,
     "id":nnodeRef.key.substr(1),
     "timestamp":Number(new Date()),
     "g_timestamp": firebase.database.ServerValue.TIMESTAMP
   });
 
}
function sendMessageToBot(data,botLink,sender,receiver) {
  request({
    url: botLink,
    method: 'POST',
    headers: {
      'Content-Type' :' application/json',
    },
    body: JSON.stringify(data)
  }, function(error, response, body) {
    if (error) { 
      console.log("error",error);
       }
    else if (response.statusCode >= 400) { 
      console.log('HTTP Error: '+response.statusCode+' - '+response.statusMessage); 
    }
    else{
      console.log("success: ",body);
      sendMessaggeToUser(body,receiver,sender);
    }
  });
}

ref.on("child_added", function(snapshot, prevChildKey) {
  var botName=snapshot.key;
  var botRef=db.ref("botChatItems/"+botName);
  botRef.on("child_added",function(snapshot,prevChildKey){
    var data=snapshot.val();
    var bRef=db.ref("botList/"+botName);
    bRef.once("value",function(snap) {
      var brefObj=snap.val();
  console.log(brefObj);
        var messageData={ "type" : data.type 
            ,"messageText" : data.content
            ,"sender": data.sender
            ,"timestamp": data.timestamp
            ,"secret":brefObj.secret
          };
          console.log("sending",messageData);
        sendMessageToBot(messageData,brefObj.endpoint,botName,data.sender);
  });
  });
});

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
