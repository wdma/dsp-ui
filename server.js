var path = require('path'); 
var express = require('express');
var app = express();
var fs = require('fs');
var http = require('http');
var https = require('https');
var exec = require("child_process");
var favicon = require('serve-favicon');
var util = require("util");
var uuidEngine = require("uuid");
var open = require("open");
const execProm = util.promisify(exec.exec);
const mkdirProm = util.promisify(fs.mkdir);
///////////////////////////////////////////////////////////////////////////////
//using letsencrypt 
//const options = {
//  key: fs.readFileSync('/etc/letsencrypt/live/www.hippocampusanalytics.com/privkey.pem'),
//  cert: fs.readFileSync('/etc/letsencrypt/live/www.hippocampusanalytics.com/fullchain.pem')
//};

//var port = (process.env.PORT || process.env.VCAP_APP_PORT || 3000);
app.enable('trust proxy');
///////////////////////////////////////////////////////////////////////////////

var dir = __dirname;

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
app.use(express.json( {limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/public', express.static(path.join(dir, '/public')));
app.use('/styles', express.static(path.join(dir, '/public/styles')));
app.use('/scripts', express.static(path.join(dir, '/public/scripts')));
app.use('/images', express.static(path.join(dir, '/public/images')));
app.use('/graphs', express.static(path.join(dir, '/graphs')));

app.get('/', function (req, res) {
  res.statusCode = 302;
  res.sendFile(path.join(dir, 'public/jargon.html'));
});

app.get('/plot', function (req, res) {
  res.statusCode = 200;
  res.sendFile(path.join(dir, 'public/plot.html'));
});

app.get('/plotdata', function (req, res) {
  res.statusCode = 200;
  res.sendFile(path.join(dir, 'plot_data/timeseries.json'));
});


app.get('/data', function (req, res) {
  res.statusCode = 200;
  res.sendFile(path.join(dir, 'graphs/hello-world.json'));
  console.log('data file sent...');
});

app.get('/data/get1', function (req, res) {
  res.statusCode = 200;
  res.sendFile(path.join(dir, 'graphs/hello-world.json'));
  console.log('data file sent...');
});

app.get('/data/get2', function (req, res) {
  res.statusCode = 200;
  res.sendFile(path.join(dir, 'graphs/demo1.json'));
  console.log('data file sent...');
});

app.get('/data/get3', function (req, res) {
  res.statusCode = 200;
  res.sendFile(path.join(dir, 'graphs/demo2.json'));
  console.log('data file sent...');
});

app.get('/data/get4', function (req, res) {
  res.statusCode = 200;
  try {
    if (fs.existsSync(path.join(dir, 'graphs/empty.json'))) {
      res.sendFile(path.join(dir, 'graphs/empty.json'));
      console.log('data file sent...');
    }
  } catch(err) {
    console.error("empty.json does not exist")
  }
});

app.get(`/getlist`, function (req, res) {
  res.statusCode = 200;
  try {
    const dir = 'graphs/', files = fs.readdirSync(dir);
    res.send({ data: files.join(',')})
    console.log('files: ', files);    
  } catch(err) {
    console.error("error reading dir")
  }
});

app.get(`/getdataFile`, function (req, res) {
  res.statusCode = 200;
  try {
    const file = "graphs/" + req.query.data + ".json";
    console.log("reading file " + file +  " ...")
    if (fs.existsSync(path.join(dir, file))) {
      res.sendFile( path.join(dir, file) );
      console.log('data file sent...');
    }else{
      console.log('cannot read file...');
      res.send({ data: 'error 1'  })
    }      
  } catch(err) {
    console.error("error ")
    res.send({ data: err })
  }
});

app.get('/getYAMLdataFile', function (req, res) {
  res.statusCode = 200;
  try {
    const file = "compiledGraphs/" + req.query.data + ".yaml";
    console.log("reading file " + file +  " ...")
    if (fs.existsSync(path.join(dir, file))) {
      res.sendFile( path.join(dir, file) );
      console.log('data file sent...');
    }else{
      console.log('cannot read file : ' + path.join(dir,file));
      res.send({  stderr: 'cannot read YAML file' })
    }      
  } catch(err) {
    console.error("error ", err)
    res.send({ data: err })
  }
});


app.post('/updateData', function (req, res) {
  res.statusCode = 200;
  console.log(req.body);
  const data = JSON.stringify(req.body, null, "\t");
  let graphname = req.body.metadata.name;
  let fn = path.join(dir, 'graphs/' + graphname + '.json')
  fs.writeFile(fn, data , function (err) {
    if (err) throw err;
    const resdata = graphname + ' saved... (' + data.length + ' bytes)';
    res.send({ data: resdata })
    console.log(resdata);
  });

});
  
app.post('/updateDataYAML', function (req, res) {
  res.statusCode = 200;
  const data = JSON.stringify(req.body, null, "\t");
  let graphname = req.body.metadata.name;
  console.log("updating file " + graphname +  " ...")

  let fn = path.join(dir, 'compiledGraphs/' + graphname + '.bak.yaml')
  fs.writeFile(fn, data , function (err) {
    if (err) throw err;
    const resdata = graphname + ' saved... (' + data.length + ' bytes)';
    res.send({ data: resdata })
    console.log(resdata);
  });

});

app.post('/compileData', function (req, res) {
  res.statusCode = 200;
  console.log(req.body);
  const data = JSON.stringify(req.body, null, "\t");
  let graphname = req.body.metadata.name;

  const {body, statusCode} = got.post('http://jargoncompiler:8080', data);
    if (statusCode !== 200 || body.error) {
      throw new Error(body.error || 'Oops. Something went wrong! Try again please.');
    };
});

app.post('/compiledData', function (req, res) {
  res.statusCode = 200;
  console.log(req.body);
  const data = JSON.stringify(req.body, null, "\t");
  let graphname = req.body.metadata.name;
  let fn = path.join(dir, 'yamls/' + graphname + '.yaml')

  fs.promises
    .writeFile(fn, data, { encoding: 'utf8' }, function (err) {
      if (err) throw err;
      const resdata = graphname + ' (' + data.length + ' bytes)';
      res.send({ data: resdata })
        //  console.log(resdata);
      })
});

var port = 8080;
console.log("The server is now listening to port " + port)
var httpServer = http.createServer(app).listen(port);
