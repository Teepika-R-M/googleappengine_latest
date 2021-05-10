'use strict';

const express = require('express');
const mysql = require('promise-mysql');
const bodyParser = require('body-parser');

const app = express();
app.set('view engine', 'pug');
app.enable('trust proxy');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());


// Automatically parse request body as form data.
//app.use(express.urlencoded({extended: false}));
// This middleware is available in Express v4.16.0 onwards
//app.use(express.json());

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
    database: 'banking',
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
    socketPath: '/cloudsql/cmpe-202-banking-project:us-west2:myinstance',
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


app.post('/accounts/user', async (req, res) =>  {
const postObj=req.body
const userID=postObj.userID

  try {
    const tabsQuery = pool.query("SELECT * FROM banking.accounts where userID=?;",[userID]);
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

app.post('/accounts', async (req, res) =>  {
const postObj=req.body
console.log("postObj")
console.log(postObj)
//const accountNum=995783922 
const accountNum = postObj.accountNum
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

app.post('/accounts/new', async (req, res) =>  {
  const timestamp = new Date();
const postObj=req.body
const userID=postObj.userID
const accountType=postObj.accountType
  try {
    const stmt = 'INSERT INTO banking.accounts (userID,totalBalance,availableBalance,accountType,accountStatus) values (?,0.0,0.0,?,"active")';
    await pool.query(stmt,[userID,accountType]);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .send(
        'Unable to successfully create accounts! Please check the application logs for more details.'
      )
      .end();
  }
  res.status(200).send('Successfully inserted records').end();
});
app.put('/accounts/balance',async (req, res) => {
const postObj=req.body
const accountNum=postObj.accountNum
const balanceType=postObj.balanceType
const balanceAmount=postObj.balanceAmount
let stmt = ""
  try {
console.log("start");
if(balanceType=="totalBalance"){
console.log("if");
 stmt = 'update banking.accounts set totalBalance=? where accountNum=?';
}
else{
console.log("else");
stmt = 'update banking.accounts set availableBalance=? where accountNum=?';
}
    await pool.query(stmt,[balanceAmount,accountNum]);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .send(
        'Unable to successfully update accounts balance amount! Please check the application logs for more details.'
      )
      .end();
  }
  res.status(200).send('Successfully updated records').end();
});

app.delete('/accounts/existing',async (req, res) => {
const postObj=req.body
const accountNum=postObj.accountNum
  try {
const stmt = 'delete from banking.accounts where accountNum=?';
    await pool.query(stmt,[accountNum]);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .send(
        'Unable to successfully delete accounts! Please check the application logs for more details.'
      )
      .end();
  }
  res.status(200).send('Successfully deleted records').end();
});
app.put('/accounts/email',async (req, res) => {
const postObj=req.body
const email=postObj.email
const userID=postObj.userID
  try {
const stmt = 'update banking.users set email=? where userID=?';
    await pool.query(stmt,[email,userID]);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .send(
        'Unable to successfully update accounts email ID! Please check the application logs for more details.'
      )
      .end();
  }
  res.status(200).send('Successfully updated records').end();
});

app.put('/accounts/password',async (req, res) => {
const postObj=req.body
const password=postObj.password
const userID=postObj.userID
  try {
const stmt = 'update banking.users set password=? where userID=?';
    await pool.query(stmt,[password,userID]);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .send(
        'Unable to successfully update accounts password! Please check the application logs for more details.'
      )
      .end();
  }
  res.status(200).send('Successfully updated records').end();
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
