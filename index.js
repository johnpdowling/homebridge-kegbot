var http = require('http');
var Accessory, Service, Characteristic, UUIDGen;

module.exports = function(homebridge) {
  console.log("homebridge API version: " + homebridge.version);

  // Accessory must be created from PlatformAccessory Constructor
  Accessory = homebridge.platformAccessory;

  // Service and Characteristic are from hap-nodejs
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen = homebridge.hap.uuid;
  
  // For platform plugin to be considered as dynamic platform plugin,
  // registerPlatform(pluginName, platformName, constructor, dynamic), dynamic must be true
  homebridge.registerPlatform("homebridge-kegbot", "KegbotPlatform", KegbotPlatform, true);
}

// Platform constructor
// config may be null
// api may be null if launched from old homebridge version
function KegbotPlatform(log, config, api) {
  log("KegbotPlatform Init");
  var platform = this;
  this.log = log;
  this.config = config;
  this.accessories = [];

  this.refresh = config['refresh'] || 60; // Update every minute
  this.url = config['url'] || "localhost";
  
  if (typeof(config.aliases) !== "undefined" && config.aliases !== null) {
    this.aliases = config.aliases;
  }
  
  if (api) {
      this.api = api;
      this.api.on('didFinishLaunching', function() {
        platform.log("DidFinishLaunching");
      }.bind(this));
  }
}

// Function invoked when homebridge tries to restore cached accessory.
// Developer can configure accessory at here (like setup event handler).
// Update current value.
KegbotPlatform.prototype.configureAccessory = function(accessory) {
  this.log(accessory.displayName, "Configure Accessory");
  var platform = this;

  // Set the accessory to reachable if plugin can currently process the accessory,
  // otherwise set to false and update the reachability later by invoking 
  // accessory.updateReachability()
  accessory.reachable = true;
  
  accessory.on('identify', function(paired, callback) {
    platform.log(accessory.displayName, "Identify!!!");
    callback();
  });
  
  //accessory.on('identify', function(paired, callback) {
  //  platform.log(accessory.displayName, "Identify!!!");
  //  callback();
  //});

  if (accessory.getService(Service.TemperatureSensor)) {

    accessory.log = this.log;
////    accessory.loggingService = new FakeGatoHistoryService("weather", accessory,4032,this.refresh * 10/60);
//    accessory.loggingService = new FakeGatoHistoryService("weather", accessory,{
//      storage: this.storage,
//      minutes: this.refresh * 10/60
//    });

    
  }

  var name = accessory.context.name;
  self.accessories[name] = accessory;
}

// Handler will be invoked when user try to config your plugin.
// Callback can be cached and invoke when necessary.
KegbotPlatform.prototype.configurationRequestHandler = function(context, request, callback) {
  this.log("configurationRequestHandler");
}

Kegbot.prototype.didFinishLaunching = function() {
  var self = this;
  
  setInterval(this.devicePolling.bind(this), this.refresh * 1000);
}

Kegbot.prototype.devicePolling = function() {
  var self = this;
  this.log("Reading Thermosensors");

  httpRequest(this.url + "/api/thermo-sensors/", "", "GET", function(err, response, responseBody) {
    if (err) {
      this.log('HTTP get failed:', err.message);
    } else {
      var response = JSON.parse(responseBody);

      if (response.meta.result != "ok") {
        self.log("Error status %s %s", response.error.code, response.error.message);
      } else {
        
        response.objects.forEach((thermo, index) => 
        {
          if(thermo.sensor_name in this.accessories)
          {
            this.accessories[thermo.sensor_name].getService(Service.TemperatureSensor).
              getCharacteristic(Characteristic.CurrentTemperature).updateValue(thermo.last_log.temperature_c);
          }
          else
          {
            this.addAccessory(thermo.sensor_name);
          }
        });
          
      }
    }
  }.bind(self));  
  for (var id in this.accessories) {
    var device = this.accessories[id];
    if (device.reachable) {
      if (device.getService(Service.TemperatureSensor)) {
        this.getDHTTemperature(device, function(err, temp) {
          if (err) {
            temp = err;
          }
          this.getService(Service.TemperatureSensor).getCharacteristic(Characteristic.CurrentTemperature).updateValue(temp);
        }.bind(device));
      }
    }
  }
}

Kegbot.prototype.addAccessory = function(accessoryName) {
  this.log("Add Accessory");
  var platform = this;
  var uuid;

  uuid = UUIDGen.generate(accessoryName);

  if(!this.accessories[accessoryName])
  {
    var displayName = this.aliases[accessoryName];
    if (typeof(displayName) == "undefined") {
      displayName = accessoryName;
    }
    var accessory = new Accessory(accessoryName, uuid, 10);

    self.log("Adding Thermo Device:", accessoryName, displayName);
    accessory.reachable = true;
    accessory.context.model = "Kegbot Thermo";
    accessory.context.name = accessoryName;
    accessory.context.displayName = displayName;

    accessory.addService(Service.TemperatureSensor, displayName)
      .getCharacteristic(Characteristic.CurrentTemperature)
      .setProps({
        minValue: -100,
        maxValue: 100
      });
    
    accessory.getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Manufacturer, "Kegbot")
      .setCharacteristic(Characteristic.Model, "Kegbot Thermo")
      .setCharacteristic(Characteristic.SerialNumber, "kb." + accessoryName)
      .setCharacteristic(Characteristic.FirmwareRevision, require('./package.json').version);
    
    accessory.on('identify', function(paired, callback) {
      platform.log(accessory.displayName, "Identify!!!");
      callback();
    });
    
    accessory.log = this.log;
    self.accessories[name] = accessory;
    self.api.registerPlatformAccessories("homebridge-kegbot", "KegbotPlatform", [accessory]);
  }
  else {
    self.log("Skipping %s", accessoryName);
    //accessory = this.accessories[name];

    // Fix for devices moving on the network
    //if (accessory.context.url != url) {
    //  debug("URL Changed", name);
    //  accessory.context.url = url;
    //} else {
    //  debug("URL Same", name);
    //}
    ////        accessory.updateReachability(true);
  }
}

function roundInt(string) {
  return Math.round(parseFloat(string) * 10) / 10;
}

function httpRequest(url, body, method, callback) {
  request({
      url: url,
      body: body,
      method: method,
      rejectUnauthorized: false,
      timeout: 10000

    },
    function(err, response, body) {
      callback(err, response, body)
    })
}
