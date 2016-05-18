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
    items: [],
	randomSequences: []
  };
  console.log('GET received for load Configuration');

  async.series([
      function(callback) {
		  loadRandomSequence(JSONresults.randomSequences, pID, callback);
	  },
      function(callback) {
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
            callback(null,'success');
          }
        });

      }
    ],
    function(err, results) {
      console.log('finishing async');
      if (err) {
        console.log('Async Error: ' + err);
        response.send('Error: ' + err);
      } else {
		  var combinedResult = {
			  results: JSONresults,
			  randomSequences: randomSequence
		  }
		  response.send(JSON.stringify(JSONresults));
	  }
    }
  );

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
  
  var experimentType = request.query.experimentType;
  console.log('loading touches for experimentType: ' + experimentType);
  

  var pID = request.query.pID;
  console.log('loading touches for pID: ' + pID);

  base('Touch Points (' + experimentType + ')').select({
    // Selecting the first 3 records in Main View:
    view: "Main View"
  }).eachPage(function page(records, fetchNextPage) {
    console.log('new page loaded');
    // This function (`page`) will get called for each page of records.

    records.forEach(function(record) {

	  console.log('record retrieved');
      console.log('participant ID: ' + record.get('Participant ID'));

      if ((pID == 'all') || (pID == record.get('Participant ID'))) {

        console.log('Retrieved ' + record.get('Name') + ' for ' + record.get('Participant ID'));
        JSONresults.items.push({
          'id': record.getId(),
          'name': record.get('Name'),
          'pID': record.get('Participant ID'),
		  'trialNumber': record.get('Trial number'),
		  'combo': record.get('Stimulus number'),
		  'targetLocation': record.get('Target location'),
		  'size': record.get('Target width/diameter'),
		  'space': record.get('Target spacing'),
          'time': record.get('Hit time ms'),      		  
		  'x-pos': record.get('Touch X p'),
          'y-pos': record.get('Touch Y p'),
		  'x-pos-mm': record.get('Touch X mm'), // Not used in app (data uploaded for later analysis)
          'y-pos-mm': record.get('Touch Y mm'), // Not used in app (data uploaded for later analysis)
          'details': record.get('Details')
        });
      }
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
	  console.log('completed loading.  sending to webpage');
	  console.log(JSON.stringify(JSONresults));
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
  
  var loadedParameters = JSON.parse(request.body.result);
  
  var experimentType = loadedParameters.experimentType;
  console.log('loading touches for experimentType: ' + experimentType);

  var prevTouches = [];
  var results = loadedParameters.items;

  console.log('assigning undefined objects to blank string');
  for (var index in results) {
    for (var key in results[index]) {
      if (typeof results[index][key] == 'undefined') {
        results[index][key] = '';
      }
      if (key == 'details') {
        results[index][key] = JSON.stringify(results[index][key]);
      } else {
        // Convert numeric to string to match string types in Airtable database
        results[index][key] = results[index][key].toString();
      }

    }
    console.log('updated result');
    console.log(results[index]);
  }
  //console.log('updated results');
  //console.log(results);
  async.series([
      // load all previous touches
      function(callback2) {
        base('Touch Points (' + experimentType + ')').select({
          // Selecting the first 3 records in Main View:
          view: "Main View"
        }).eachPage(function page(records, fetchNextPage) {

          // This function (`page`) will get called for each page of records.

          records.forEach(function(record) {
            console.log('Retrieved ', record.get('Name'));
            prevTouches.push({
              'id': record.getId(),
              'name': record.get('Name'),
              'pID': record.get('Participant ID'),
			  'trialNumber': record.get('Trial number'),
			  'combo': record.get('Stimulus number'),
			  'targetLocation': record.get('Target location'),
			  'size': record.get('Target width/diameter'),
			  'space': record.get('Target spacing'),
			  'time': record.get('Hit time ms'),
              'x-pos': record.get('Touch X p'),
              'y-pos': record.get('Touch Y p'),
			  'x-pos-mm': record.get('Touch X mm'),
              'y-pos-mm': record.get('Touch Y mm'),
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
            "Participant ID": result['pID'] ? result['pID'] : '',
			"Trial number": result['trialNumber'] ? parseInt(result['trialNumber']) : 0,
			"Stimulus number": result['combo'] ? result['combo'] : '',
			"Target location": result['targetLocation'] ? parseInt(result['targetLocation']) : 0,
			"Target width/diameter": result['size'] ? result['size'] : '',
			"Target spacing": result['space'] ? result['space'] : '',
			"Hit time ms": result['time'] ? result['time'] : '',
            "Touch X p": result['x-pos'] ? result['x-pos'] : '',
            "Touch Y p": result['y-pos'] ? result['y-pos'] : '',
			"Touch X mm": result['x-pos-mm'] ? result['x-pos-mm'] : '',
            "Touch Y mm": result['y-pos-mm'] ? result['y-pos-mm'] : '',
            "Details": result['details'] ? JSON.parse(result['details']) : ''
          };
          console.log(newEntry);

          for (var index in prevTouches) {
            if ((prevTouches[index].pID == result['pID']) &&
              (prevTouches[index].combo == result['combo']) &&
              (prevTouches[index].details['quadrant'] == result.details['quadrant']) &&
              (prevTouches[index].details['round'] == result.details['round'])) {
			  console.log('located previous name of ' + prevTouches[index].name);
			  console.log(prevTouches[index]);
              id = prevTouches[index].id;
            }
          }
          if (id == 'none') {
            console.log('creating new entry');

            base('Touch Points (' + experimentType + ')').create(newEntry, function(err, record) {
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

            base('Touch Points (' + experimentType + ')').replace(id, newEntry, function(err, record) {
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

function loadRandomSequence(randomSequences, pID, callback) {

  base('Random Sequence').select({
    // Selecting the records in Main View:
    view: "Main View"
  }).eachPage(function page(records, fetchNextPage) {

    // This function (`page`) will get called for each page of records.

    records.forEach(function(record) {
      console.log('Retrieved ' + record.get('pID') + ' sequence ' + record.get('Random Sequence').toString());
	  var recordJSON = {
		  id: recordgetId(),
		  pID: record.get('pID'),
		  randomSequence: record.get('Random Sequence')
	  }
      randomSequences.push(recordJSON);
    });

    // To fetch the next page of records, call `fetchNextPage`.
    // If there are more records, `page` will get called again.
    // If there are no more records, `done` will get called.
    fetchNextPage();

  }, function done(error) {
    if (error) {
      console.log(error);
      callback(error);
    } else {
	  console.log('done loading all random sequences');
      callback(null, 'done replacing all entries');
    }
  });
}