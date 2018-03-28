# homebridge-kegbot
[![NPM Downloads](https://img.shields.io/npm/dm/homebridge-kegbot.svg?style=flat)](https://npmjs.org/package/homebridge-kegbot)

Homebridge plugin for [Kegbot Server](https://github.com/Kegbot/kegbot-server). Current functionality exposes Kegbot Thermo Sensors as HomeKit Temperature Sensors.

# Installation
(assumes you have a working Kegbot Server installation already running)
1. Install homebridge using: npm install -g homebridge
2. Install homebridge-kegbot using: npm install -g homebridge-kegbot
3. Update your configuration file, see sample-config.json or below for examples.

# Configuration

```

    "bridge": {
        "name": "FooBridge",
        "username": "CC:22:3D:E3:CD:39",
        "port": 51826,
        "pin": "031-45-154"
    },

    "description": "Homebridge install",

    "platforms": [
      { 
        "platform": "Kegbot",
        "name": "Kegberry Server",
        "aliases": {
          "thermo-d200000123456f78": "Air Sensor",
          "thermo-e300000987654a32": "Liquid Sensor"
         }
       }
    ],

"accessories": [ ]

}
```
## Optional parameters

- url - URL of your kegbot installation, defaults to localhost
- apikey - API key for authenticating calls to server (if necessary), default is none
- refresh - Refresh rate in seconds for data, defaults to 60 seconds
- aliases - Friendly names for your thermo sensors
