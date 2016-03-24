var express = require('express'); // POST GET
var bodyParser = require('body-parser'); // POST parsing
var app = express(); // POST GET
var cors = require('cors'); // allows current page to access other webpages or URLs
var async = require('async'); // asynchronous callback triggers

app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());
app.use(cors());

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index');
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

var Airtable = require('airtable');
Airtable.configure({
  endpointUrl: 'https://api.airtable.com',
  apiKey: 'keyWInwqgSshQe7GV'
});
var base = Airtable.base('appQGPt8lnDSPI25o');

app.get('/loadConfiguration', function(request, response) {
  var JSONresult = {
    items: []
  };
  console.log('GET received');
  base('Configuration Table').select({
    // Selecting the first 3 records in Main View:
    view: "Main View"
  }).eachPage(function page(records, fetchNextPage) {

    // This function (`page`) will get called for each page of records.

    records.forEach(function(record) {
      console.log('Retrieved ', record.get('Name'));
      items.result.push({
        'id': record.getId(),
        'name': record.get('Name'),
		'type': record.get('Type'),
        'x-pos': record.get('X Position'),
        'y-pos': record.get('Y Position'),
        'size-x': record.get('Size X'),
        'size-y': record.get('Size Y')
      });
    });

    // To fetch the next page of records, call `fetchNextPage`.
    // If there are more records, `page` will get called again.
    // If there are no more records, `done` will get called.
    fetchNextPage();

  }, function done(error) {
    if (error) {
      console.log(error);
    } else {
      response.send(JSON.stringify(JSONresult));
    }
  });
  //response.send('done');
});

// Saves endorsement changes to Airtable
app.post('/saveConfiguration', function(request, response) {
  console.log('POST received');
  var result = (JSON.parse(request.body.result)).items;
  for (var index in result) {
	  console.log('index :' + index);
    // save new result
    if ((typeof result[index].id == 'undefined') ||
      (result[index].id == '')) {
      base('Configuration Table').create({
        "Name": result[index].name,
        "Type": result[index].type,
        "X Position": result[index]['x-pos'],
        "Y Position": result[index]['y-pos'],
        "Size X": result[index]['size-x'],
        "Size Y": result[index]['size-y']
      }, function(err, record) {
        if (err) {
          console.log(err);
          return;
        }
        console.log('done creating new entry');
        response.send('done creating new entry');
      });
    } else {
      // update old entry
      base('Configuration Table').replace(result[index].id, {
        "Name": result[index].name,
        "Type": result[index].type,
        "X Position": result[index]['x-pos'],
        "Y Position": result[index]['y-pos'],
        "Size X": result[index]['size-x'],
        "Size Y": result[index]['size-y']
      }, function(err, record) {
        if (err) {
          console.log(err);
          return;
        }
        console.log('done replacing entry');
        response.send('done replacing entry');
      });
    }
  }
  //response.send('done');
});