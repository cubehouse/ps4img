// config file

// copy this file to config.js and modify the values as needed

module.exports = {
    // MySQL connection details
    //  SQL file should be imported first to setup the tables
    db: {
        host     : 'dbhost',
        user     : 'dbuser',
        password : 'dbpass',
        database : 'dbname',
    },
    // Twitter API keys
    twitter: {
        consumer_key: '',
        consumer_secret: '',
        access_token_key: '',
        access_token_secret: '',
    },
    storage_dir: "/path/to/storage/directory", // without trailing slash
    sub_dirs: 1, // how many sub-directories to store images into
};