//var fs = require('fs');
//var http = require('http');
//var https = require('https');
//var exec = require("child_process");
//var favicon = require('serve-favicon');
//var util = require("util");
//var uuidEngine = require("uuid");
//var open = require("open");
//const execProm = util.promisify(exec.exec);
//const mkdirProm = util.promisify(fs.mkdir);

import { join,dirname } from 'path'; 
import {fileURLToPath} from 'url';
import express from 'express';
import cors from 'cors';
import * as http from 'http';
import * as fs from 'fs';


//import { fstat } from 'fs';
//import { ChildProcess } from 'child_process';
//import serveFavicon from 'serve-favicon';

var app = express().use("*",cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
///////////////////////////////////////////////////////////////////////////////
//using letsencrypt 
//const options = {
//  key: fs.readFileSync('/etc/letsencrypt/live/www.hippocampusanalytics.com/privkey.pem'),
//  cert: fs.readFileSync('/etc/letsencrypt/live/www.hippocampusanalytics.com/fullchain.pem')
//};

//var port = (process.env.PORT || process.env.VCAP_APP_PORT || 3000);
app.enable('trust proxy');
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
app.use(express.json( {limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


app.set('/scripts', join(__dirname + '/scripts'));
app.set('/styles', join(__dirname + '/styles'));
app.set('/images', join(__dirname + '/images'));
app.set('/graphs', join(__dirname + '/graphs'));
app.set('/plotdata', join(__dirname + '/plotdata'));

app.get('/', function (req, res) {
  res.statusCode = 302;
  res.sendFile(join(__dirname, '/public/jargon.html'));
});

app.get('/plot', function (req, res) {
  res.statusCode = 200;
  res.sendFile(join(__dirname, '/public/plot.html'));
});

app.get('/plotdata', function (req, res) {
  res.statusCode = 200;
  res.sendFile(join(__dirname, '/plotdata/timeseries.json'));
});


app.get('/data', function (req, res) {
  res.statusCode = 200;
  res.sendFile(join(__dirname, '/graphs/hello-world.json'));
  console.log('data file sent...');
});

app.get('/data/get1', function (req, res) {
  res.statusCode = 200;
  res.sendFile(join(__dirname, '/graphs/hello-world.json'));
  console.log('data file sent...');
});

app.get('/data/get2', function (req, res) {
  res.statusCode = 200;
  res.sendFile(join(__dirname, '/graphs/demo1.json'));
  console.log('data file sent...');
});

app.get('/data/get3', function (req, res) {
  res.statusCode = 200;
  res.sendFile(join(__dirname, '/graphs/demo2.json'));
  console.log('data file sent...');
});

app.get('/data/get4', function (req, res) {
  res.statusCode = 200;
  try {
    if (fs.existsSync(join(__dirname, '/graphs/empty.json'))) {
      res.sendFile(join(__dirname, '/graphs/empty.json'));
      console.log('data file sent...');
    }
  } catch(err) {
    console.error("empty.json does not exist")
  }
});

app.get(`/getlist`, function (req, res) {
  res.statusCode = 200;
  try {
    let files = fs.readdirSync(join(__dirname, '/graphs'));
    res.send({ data: files.join(',')})
    console.log('files: ', files);    
  } catch(err) {
    console.error("error reading dir")
  }
});

app.get(`/getdataFile`, function (req, res) {
  res.statusCode = 200;
  try {
    const file = join(req.query.data + ".json");
    const fp = join(__dirname, "/graphs/" + file);
    console.log("reading file " + file +  " ...")
    if (fs.existsSync(fp)) {
      res.sendFile(fp);
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
    const file = join(req.query.data + ".yaml");
    const fp = join(__dirname, "compiledGraphs/" + file);
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
  let fn = join(__dirname, '/graphs/' + graphname + '.json')
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

  let fn = join(__dirname, '/compiledGraphs/' + graphname + '.bak.yaml')
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
  let fn = join(__dirname, '/yamls/' + graphname + '.yaml')

  fs.promises
    .writeFile(fn, data, { encoding: 'utf8' }, function (err) {
      if (err) throw err;
      const resdata = graphname + ' (' + data.length + ' bytes)';
      res.send({ data: resdata })
        //  console.log(resdata);
      })
});


function startServer(server, port, host) {
  function onError(error) {
    server
      .removeListener('error', onError)
      .removeListener('listening', onSuccess)
    if (error.code === 'EADDRINUSE') {
      startServer(server, ++port, host)
    }
  }

  function onSuccess() {
    console.log(
      `listening at: (host = ${host}, port = ${server.address().port})`
    )
  }
  server.listen(port, host)
  .on('error', onError)
  .on('listening', onSuccess)
}


var port = 8080;
const host = '0.0.0.0';
const server = http.createServer(app)

console.log("The server is now listening to port " + port)
startServer(server, port, host)
//var httpServer = http.createServer(app).listen(port);
