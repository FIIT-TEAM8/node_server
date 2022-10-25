const pg = require("pg");
const { dbCfg } = require("../config");
const { errLog, infoLog } = require("../utils/logging");

/*  Use for transactions:

const db = require(db/postgres)

;(async () => {
    const client = await db.connect()
    try {
        await client.query('BEGIN')
        const query = {
            text: `SELECT * FROM user WHERE username = $1`,
            values: ["tester"]
        }
        await client.query(query)
        ...
        more queries
        ...
        await client.query('COMMIT')
    } catch (e) {
        await client.query('ROLLBACK')
    } finally {
        client.release()
    }
}
*/

/* Use for simple queries

const query = {
    text: `SELECT * FROM user WHERE username = $1`,
    values: ["tester"]
}
await db.query(query)

*/

// ================== Node postgres date fix - start
// https://github.com/brianc/node-postgres/issues/818

const { types } = pg;
const DATATYPE_DATE = 1082;
types.setTypeParser(DATATYPE_DATE, (value) => value);

// ================== Node postgres date fix - end

let pool = null;

const createPool = async () => {
  infoLog("Connecting to a PostgreSQL database.");
  let connectionTries = 30;
  while (connectionTries) {
    infoLog(`Tries left: ${connectionTries}`);
    try {
      pool = new pg.Pool({
        user: dbCfg.POSTGRES_USER,
        host: dbCfg.POSTGRES_HOST,
        database: dbCfg.POSTGRES_DB,
        password: dbCfg.POSTGRES_PASSWORD,
        port: dbCfg.POSTGRES_PORT,
      });
    } catch (err) {
      // errLog(err)
      errLog(err);
    }
    if (pool) {
      break;
    } else {
      // wait 5 seconds
      // eslint-disable-next-line no-await-in-loop, no-promise-executor-return
      await new Promise((res) => setTimeout(res, 5000)).catch(() => {});
      connectionTries -= 1;
    }
  }
  infoLog("Moving on.");
};

const getPool = async () => {
  if (pool) {
    return pool;
  }
  await createPool();
  return pool;
};

module.exports = {

  getPool,

  query: async (args) => {
    const connection = await getPool();
    const result = await connection.query(args);
    return result;
  },

  connect: async () => {
    const connection = await getPool();
    const result = await connection.connect();
    return result;
  },
};
