//container for all the environments
let environments = {};

// staging (default) environment
environments.staging = {
  httpsPort: 3001,
  httpPort: 3000,
  envName: 'staging',
  hashingSecret: 'thisIsASecret',
  maxChecks: 5,
  twilio: {
    accounstSid: 'ACb32d411ad7fe886aac54c665d25e5c5d',
    authToken: '9455€3eb3109edc12e3d8c92768f7a67',
    fromPhone: '+15005550006'
  },
  templateGlobals: {
    appName: 'UptimeChecker',
    companyName: 'NotARealCompany, Inc',
    yearCreated: '2024',
    baseUrl: 'http://localhost:3000/'
  }
};

//production environment
environments.production = {
  httpsPort: 5001,
  httpPort: 5000,
  envName: 'production',
  hashingSecret: 'thisIsASecret',
  maxChecks: 5,
  twilio: {
    accounstSid: '',
    authToken: '',
    fromPhone: '',
  },
  templateGlobals: {
    appName: 'UptimeChecker',
    companyName: 'NotARealCompany, Inc',
    yearCreated: '2024',
    baseUrl: 'http://localhost:5000/'
  }
};

//determine which environment was passed as a command-line argument
let currentEnvironmet = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// check that the current environment is one of the environments above, if not, default to staging
let environmentToExport = typeof(environments[currentEnvironmet]) == 'object' ? environments[currentEnvironmet] : environments.staging;

//export the module
module.exports = environmentToExport;
