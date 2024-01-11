const firebird = require('node-firebird');
const fbdb = require('./fbdb');
const options = fbdb.options;
const poolsize = 100;

const pool = firebird.pool(poolsize, options);

function executeQuery(query, params, db) {
	return new Promise((resolve, reject) => {
		pool.get((err, db) => {
			if (err) {
				reject(err);
				return;
			}

			db.query(query, params, (err, result) => {
				db.detach();
				if (err) {
					reject(err);
				} else {
					resolve(ab2str(result));
				}
			});
		});
		pool.destroy();
	});
}

async function doQuery(query, params, db, timeout) {
	if(!timeout) {
		timeout = 60000;
	}
	try {
		const queryPromise = executeQuery(query, params, db);
		const timeoutPromise = new Promise((resolve, reject) => {
			setTimeout(() => reject(new Error(`Query timed out: ${query}`)), timeout);
		});
		return await Promise.race([queryPromise, timeoutPromise]);
	} catch (error) {
		console.error('Error:', error);
		return error;
	}
}

function ab2str(result) {
	if(result && result.length>0) {
		for (let i = 0; i < result.length; i++) {                        
			for (const [key, value] of Object.entries(result[i])) {
				if(Buffer.isBuffer(value)){
					result[i][key] =  `${value}`;
				}
			}
		}
	}
    return result;
}

module.exports = {
	doQuery,
};
