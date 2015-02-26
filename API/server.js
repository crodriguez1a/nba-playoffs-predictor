//require
var https = require('https')
var restify = require('restify');
var _ = require('lodash');
var moment = require('moment');
var fs = require('fs');

//create server
var server = restify.createServer();

server.use(restify.queryParser());
server.use(restify.bodyParser());

server.use(restify.CORS());
server.use(restify.fullResponse());
restify.CORS.ALLOW_HEADERS.push('Accept-Encoding');
restify.CORS.ALLOW_HEADERS.push('Accept-Language');
restify.CORS.ALLOW_HEADERS.push('authorization');



var API = {}

API.saveCache = function(obj){
  var timestamp = {"version": {"modified": moment().format('YYYY-MM-DDTHH:mm:ssZ')}};
  console.log(moment().format('YYYY-MM-DD HH:mm:ss'));
  _.merge(obj, timestamp);

  fs.writeFile(__dirname + '/cache.json', JSON.stringify(obj) , function (err) {
    if (err) throw err;
    return;
  });

};


API.getAPI = function(req, res, next) {
  var client = restify.createJsonClient({
    url: 'https://erikberg.com/',
    version: '*',
    userAgent: 'playoffpredictions/0.1 (https://nbaplayoffs.in/)'
  });

  client.get('/nba/standings.json', function(_err, _req, _res, _obj) {

    if (!_.has(_.obj, 'error')) {
      API.saveCache(_obj);
    }

    return res.send(_obj);

  });

  return next();
}


API.readCache = function(req, res, next) {
  fs.readFile(__dirname + '/cache.json', {encoding: 'utf-8'}, function (err, obj) {
    if (err) throw err;

    var _obj = JSON.parse(obj);
    var wasCached = _.has(_obj, 'version');

    if (wasCached) {
      var now = moment();
      var cached = moment(_obj.version.modified);
      var fetched = now.diff(cached, 'minutes');

      if(fetched < 60) {
        return res.send(_obj);
      }
    }

    return next();

  });
}




server.get({ path: '/data.json' }, API.readCache, API.getAPI);
server.listen(1338);
