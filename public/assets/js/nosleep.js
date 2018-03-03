var request = require('request'),
CronJob = require('cron').CronJob,
util = require('util'),
EventEmitter = require('events');

const DEFAULT_CRON_INTERVAL = '*/60 * * * * *';

var ping = function(url, cb){
		request({uri: url, followRedirect: true}, function(e,r,b){
			if(!e && r.statusCode == 200){
				cb && cb(null, b);
			}else{
				cb && cb(e);
			}			
		});
};

function PingManager(services) {
  
  EventEmitter.call(this);
  this.cronInstances = [];
  this.updateServices(services);

}



util.inherits(PingManager, EventEmitter);

PingManager.prototype.stop = function(){
	this.cronInstances.forEach(function(cronJob){
		cronJob.stop();
	});
};


PingManager.prototype.startServices = function(services){

	this.stop();
  var that = this;
  this.cronInstances = services.map(function(service, i){
		return new CronJob(service.cron || DEFAULT_CRON_INTERVAL, function(){
			ping(service.url, function(err, body){
			if(err){
				that.emitFailure({
					service: service,
					error: err
				});				
			}else{
				that.emitSuccess({
					service: service,
					body: body
				});
			}
			});
		}, null, true, "America/Los_Angeles");
	});
};

PingManager.prototype.updateServices = function(services){
	this.stop();
	this.startServices(services);
};


PingManager.prototype.emitSuccess = function(obj){
	obj.time  = this.getCurrentTime();
	this.emit('pm-success', obj);
};
PingManager.prototype.emitFailure = function(obj){
	obj.time  = this.getCurrentTime();
	this.emit('pm-error', obj);
};
PingManager.prototype.getCurrentTime = function(){
	return new Date();
};
//--------------------------------------

module.exports = PingManager;