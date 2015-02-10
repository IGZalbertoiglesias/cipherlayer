var debug = require('debug')('cipherlayer:routes:auth');

var userMng = require('../managers/user')();
var config = require('../../config.json');

function createUserEndpoint(req, res, next) {
    userMng.createUser(req, function(err, tokens){
        if (err) {
            if (!err.code ) {
                res.send(500, err);
            } else {
                var errCode = err.code;
                delete(err.code);
                res.send(errCode, err);
            }
            return next(false);
        } else {
            res.send(201, tokens);
            return next();
        }
    });
}

function createDirectLoginUser(req, res, next) {
    userMng.createDirectLoginUser(req, function(err, tokens){
        if (err) {
            if (!err.code ) {
                res.send(500, err);
            } else {
                var errCode = err.code;
                delete(err.code);
                res.send(errCode, err);
            }
            return next(false);
        } else {
            var compatibleDevices = config.compatibleEmailDevices;
            var device = String(req.headers['user-agent']);

            for(var i = 0; i < compatibleDevices.length; i++){
                var exp = compatibleDevices[i];
                var check = exp.replace(/\*/g,'.*');
                var match = device.match(check);
                var isCompatible = (match !== null && device === match[0]);
                debug('match \''+ device +'\' with \'' + exp + '\' : ' + isCompatible);
                if(isCompatible) {
                    debug('device \''+device+'\'');
                    res.header('Location', 'mycomms://user/refreshToken/' + tokens.refreshToken );
                    res.send(302);
                    return next(false);
                }
            }
            res.send(200, { msg: config.nonCompatibleEmailMsg } );
            return next();
        }
    });
}

function addRoutes(service){
    service.post(config.passThroughEndpoint.path, createUserEndpoint);
    service.get('/user/activate', createDirectLoginUser);

    debug('User creation routes added');
}

module.exports = addRoutes;
