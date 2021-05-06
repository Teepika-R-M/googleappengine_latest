'use strict';

const express = require('express');
const mysql = require('promise-mysql');

const app = express();
app.set('view engine', 'pug');
app.enable('trust proxy');

// Automatically parse request body as form data.
app.use(express.urlencoded({extended: false}));
// This middleware is available in Express v4.16.0 onwards
app.use(express.json());

// Set Content-Type for all responses for these routes.
app.use((req, res, next) => {
  res.set('Content-Type', 'text/html');
  next();
});

// Create a Winston logger that streams to Stackdriver Logging.
const winston = require('winston');
const {LoggingWinston} = require('@google-cloud/logging-winston');
const loggingWinston = new LoggingWinston();
const logger = winston.createLogger({
  level: 'info',
  transports: [new winston.transports.Console(), loggingWinston],
});

const createTcpPool = async config => {
  // Extract host and port from socket address
  const dbSocketAddr = '35.236.69.164:3306'
         console.log("Hell");
console.log("Inside TCP1");
  // Establish a connection to the database
  return await mysql.createPool({
    user: 'root', // e.g. 'my-db-user'
    password: 'root', // e.g. 'my-db-password'
    database: 'banking1',
    host: '35.236.69.164', //dbSocketAddr[0], // e.g. '127.0.0.1'
    port: '3306', //dbSocketAddr[1], // e.g. '3306'
    // ... Specify additional properties here.
    ...config,
  });
console.log("End of TCP");
};

const createUnixSocketPool = async config => {
console.log("Inside Socket")
//  const dbSocketPath = 'sc' || '/cloudsql';
//console.log(dbSocketPath);
  // Establish a connection to the database
  return await mysql.createPool({
    user: 'root', // e.g. 'my-db-user'
    password: 'root', // e.g. 'my-db-password'
    database: 'banking', // e.g. 'my-database'
    // If connecting via unix domain socket, specify the path
    socketPath: `cloudsql/cmpe-202-banking-project:us-west2:myinstance`,
    // Specify additional properties here.
    ...config,
  });
};
// [END cloud_sql_mysql_mysql_create_socket]

const createPool = async () => {
  const config = {
    // [START cloud_sql_mysql_mysql_limit]
    // 'connectionLimit' is the maximum number of connections the pool is allowed
    // to keep at once.
    connectionLimit: 5,
    // [END cloud_sql_mysql_mysql_limit]

    // [START cloud_sql_mysql_mysql_timeout]
    // 'connectTimeout' is the maximum number of milliseconds before a timeout
    // occurs during the initial connection to the database.
    connectTimeout: 10000, // 10 seconds
    // 'acquireTimeout' is the maximum number of milliseconds to wait when
    // checking out a connection from the pool before a timeout error occurs.
    acquireTimeout: 10000, // 10 seconds
    // 'waitForConnections' determines the pool's action when no connections are
    // free. If true, the request will queued and a connection will be presented
    // when ready. If false, the pool will call back with an error.
    waitForConnections: true, // Default: true
    // 'queueLimit' is the maximum number of requests for connections the pool
    // will queue at once before returning an error. If 0, there is no limit.
    queueLimit: 0, // Default: 0
    // [END cloud_sql_mysql_mysql_timeout]

    // [START cloud_sql_mysql_mysql_backoff]
    // The mysql module automatically uses exponential delays between failed
    // connection attempts.
    // [END cloud_sql_mysql_mysql_backoff]
  };
  console.log("process.env.DB_HOST")
  console.log(process.env.DB_HOST)

  //if (process.env.DB_HOST) {
//    return await createTcpPool(config);
  //} else {
    return await createUnixSocketPool(config);
  //}
};

const ensureSchema = async pool => {
  // Wait for tables to be created (if they don't already exist).
  console.log("Ensured that table 'votes' exists");
};

const createPoolAndEnsureSchema = async () =>
  await createPool()
    .then(async pool => {
      await ensureSchema(pool);
      return pool;
    })
    .catch(err => {
      throw err;
    });

let pool;

app.use(async (req, res, next) => {
  if (pool) {
    return next();
  }
  try {
    pool = await createPoolAndEnsureSchema();
    next();
  } catch (err) {
    logger.error(err);
    return next(err);
  }
});


app.get('/', async (req, res) =>  {
const postObj=req.body
const userID=postObj.userID
  try {
    const tabsQuery = pool.query("SELECT * FROM banking.accounts;");
        let x = await tabsQuery;
res.json(x);
} catch (err) {
        console.error(err);
    res
      .status(500)
      .send(
        'Unable to load page. Please check the application logs for more details.'
      )
      .end();
  }
});

app.get('/check', (req, res) => {
  res.send('Hello World!')
});

app.get('/users', async (req, res) =>  {
const postObj=req.body
const accountNum=postObj.accountNum
  try {
    const tabsQuery = pool.query("SELECT * FROM banking.accounts where accountNum=?;",[accountNum]);
        let x = await tabsQuery;
res.json(x);
} catch (err) {
        console.error(err);
    res
      .status(500)
      .send(
        'Unable to load page. Please check the application logs for more details.'
      )
      .end();
  }
});

const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});

process.on('uncaughtException', function (err) {
    console.log(err);
throw err;
}); 

module.exports = server;
