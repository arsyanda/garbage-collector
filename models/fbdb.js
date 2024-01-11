var options = {};
options.host = process.env.DB_HOST;
options.port = process.env.DB_PORT;
options.database = process.env.DB_STRING;
options.user = process.env.DB_USER;
options.password = process.env.DB_PASS;
options.lowercase_keys = false;
options.role = null;
options.pageSize = 4096;

module.exports = {
    options
}