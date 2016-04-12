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
  var JSONresults = {
    items: []
  };
  console.log('GET received for load Configuration');
  base('Configuration Table').select({
    // Selecting the first 3 records in Main View:
    view: "Main View"
  }).eachPage(function page(records, fetchNextPage) {

    // This function (`page`) will get called for each page of records.

    records.forEach(function(record) {
      console.log('Retrieved ', record.get('Name'));
      JSONresults.items.push({
        'id': record.getId(),
        'name': record.get('Name'),
        'type': record.get('Type'),
        'x-pos': record.get('X Position'),
        'y-pos': record.get('Y Position'),
        'size-x': record.get('Size X'),
        'size-y': record.get('Size Y'),
        'padding': record.get('Padding')
      });
    });

    // To fetch the next page of records, call `fetchNextPage`.
    // If there are more records, `page` will get called again.
    // If there are no more records, `done` will get called.
    fetchNextPage();

  }, function done(error) {
    if (error) {
      console.log(error);
      response.send(error);
    } else {
      response.send(JSON.stringify(JSONresults));
    }
  });
  //response.send('done');
});

// Saves endorsement changes to Airtable
app.post('/saveConfiguration', function(request, response) {
  console.log('POST received');
  if (typeof request.body == 'undefined') {
    console.log('request body is undefined');
    response.send('undefined body');
  }
  console.log(request.body);
  //var result = (JSON.parse(request.body.result)).items;
  var results = (JSON.parse(request.body.result)).items;
  async.each(results, function(result, callback) {
    // save new result
    if ((typeof result.id == 'undefined') ||
      (result.id == '')) {
      console.log('creating new entry');
      base('Configuration Table').create({
        "Name": result.name,
        "Type": result.type,
        "X Position": result['x-pos'],
        "Y Position": result['y-pos'],
        "Size X": result['size-x'],
        "Size Y": result['size-y'],
        "Padding": result['padding']
      }, function(err, record) {
        if (err) {
          console.log(err);
          callback(err);
          return;
        }
        console.log('done creating new entry');
        callback(null, 'success');
      });
    } else {
      // update old entry
      console.log('updating old entry');
      base('Configuration Table').replace(result.id, {
        "Name": result.name,
        "Type": result.type,
        "X Position": result['x-pos'],
        "Y Position": result['y-pos'],
        "Size X": result['size-x'],
        "Size Y": result['size-y'],
        "Padding": result['padding']
      }, function(err, record) {
        if (err) {
          console.log(err);
          callback(err);
          return;
        }
        console.log('done replacing entry');
        callback(null, 'success');
      });
    }
  }, function(error) {
    if (error) {
      console.log('Error: ' + error);
      response.send('Error: ' + error);
      return;
    } else {
      console.log('done replacing all entries');
      response.send('done replacing all entries');
    }
  });

});

app.get('/loadTouches', function(request, response) {
  var JSONresults = {
    items: []
  };
  console.log('GET received for loadTouches');
  base('Touch Points').select({
    // Selecting the first 3 records in Main View:
    view: "Main View"
  }).eachPage(function page(records, fetchNextPage) {

    // This function (`page`) will get called for each page of records.

    records.forEach(function(record) {
      console.log('Retrieved ', record.get('Name'));
      JSONresults.items.push({
        'id': record.getId(),
        'name': record.get('Name'),
        'x-pos': record.get('X Position'),
        'y-pos': record.get('Y Position'),
        'time': record.get('Time'),
        'combo': record.get('Combo'),
        'size': record.get('Size'),
        'space': record.get('Space'),
        'quadrant': record.get('Quadrant'),
        'trial': record.get('Trial'),
        'details': record.get('Details')
      });
    });

    // To fetch the next page of records, call `fetchNextPage`.
    // If there are more records, `page` will get called again.
    // If there are no more records, `done` will get called.
    fetchNextPage();

  }, function done(error) {
    if (error) {
      console.log(error);
      response.send(error);
    } else {
      response.send(JSON.stringify(JSONresults));
    }
  });
  //response.send('done');
});

// Saves endorsement changes to Airtable
app.post('/saveTouches', function(request, response) {
  console.log('POST received');
  if (typeof request.body == 'undefined') {
    console.log('request body is undefined');
    response.send('undefined body');
  }
  console.log(request.body);

  var prevTouches = [];
  var results = (JSON.parse(request.body.result)).items;
  
  for (var key in results) {
	  if (typeof results[key] == 'undefined') {
		  results[key] = '';
	  }
  }

  async.series([
      // load all previous touches
      function(callback2) {
        base('Touch Points').select({
          // Selecting the first 3 records in Main View:
          view: "Main View"
        }).eachPage(function page(records, fetchNextPage) {

          // This function (`page`) will get called for each page of records.

          records.forEach(function(record) {
            console.log('Retrieved ', record.get('Name'));
            prevTouches.push({
              'id': record.getId(),
              'name': record.get('Name'),
              'x-pos': record.get('X Position'),
              'y-pos': record.get('Y Position'),
              'time': record.get('Time'),
              'combo': record.get('Combo'),
              'size': record.get('Size'),
              'space': record.get('Space'),
              'quadrant': record.get('Quadrant'),
              'trial': record.get('Trial'),
              'details': record.get('Details')
            });
          });

          // To fetch the next page of records, call `fetchNextPage`.
          // If there are more records, `page` will get called again.
          // If there are no more records, `done` will get called.
          fetchNextPage();

        }, function done(error) {
          if (error) {
            console.log(error);
            callback2(error);
			return;
          } else {
            console.log('all previous touches loaded');
            callback2(null, 'loading succeeded');
          }
        });

      },
      function(callback2) {
		// create new touches or update previous ones
		console.log('preparing to write to Airtable');
        async.each(results, function(result, callback) {
          // save new result
		  var id = 'none';
		  console.log('loading result into data object');
		  var newEntry = {

              "Name": result['name'] ? result['name'] : '',
              "X Position": result['x-pos'] ? result['x-pos'] : '',
              "Y Position": result['y-pos'] ? result['y-pos'] : '',
              "Time": result['time'] ? result['time'] : '',
              "Combo": result['combo'] ? result['combo'] : '',
              "Size": result['size'] ? result['size'] : '',
              "Space": result['space'] ? result['space'] : '',
              "Quadrant": result['quadrant'] ? result['quadrant'] : '',
              "Trial": result['trial'] ? result['trial'] : '',
              "Details": result['details'] ? result['details'] : ''
		  };
		  console.log(newEntry);
			
		  for (var index in prevTouches) {
			  if ((prevTouches[index].combo == result['combo']) &&
			      (prevTouches[index].quadrant == result['quadrant']) &&
				  (prevTouches[index].trial == result['trial']))
				  {
					  id = prevTouches[index].id;
				  }
		  }
          if (id == 'none') {
            console.log('creating new entry');

			
            base('Touch Points').create(newEntry, function(err, record) {
              if (err) {
                console.log(err);
                callback(err);
                return;
              }
              console.log('done creating new entry');
              callback(null, 'success');
            });
          } else {
            // update old entry
            console.log('updating old entry');
			
            base('Touch Points').replace(id, newEntry, function(err, record) {
              if (err) {
                console.log(err);
                callback(err);
                return;
              }
              console.log('done replacing entry');
              callback(null, 'success');
            });
          }
        }, function(error) {
          if (error) {
            console.log('Error: ' + error);
            callback2(error);
            return;
          } else {
            console.log('done replacing all entries');
            callback2(null, 'done replacing all entries');
          }
        });
      }
    ],
    // optional callback
    function(error, results) {
      // results is now equal to ['one', 'two']
      if (error) {
        console.log('Error: ' + error);
        response.send('Error: ' + error);
        return;
      } else {
        console.log('done replacing all entries');
        response.send('done replacing all entries');
      }
    });

});