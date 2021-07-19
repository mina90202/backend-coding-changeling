// modules
const { createServer } = require('http');
const https = require('https');
const { URL } = require('url');
const { parse } = require('querystring');

// constants
const PORT = 7878;
const month = (30 * 1 * 24 * 60 * 60 * 1000);

// utils
const utils = {};

// get search url
utils.getURL = () => {
    const date = new Date(Date.now() - month);
    const formattedDate = date.toISOString().split('T')[0];
    return `/search/repositories?q=created:>${formattedDate}&sort=stars&order=desc`;
}

// get pathname from url
utils.getPathName = function (req) {
    const { pathname } = new URL(`http://${req.url}`);
    return pathname;
}

// get query strings from url
utils.getQueryString = function (req, key) {
    const url = new URL(`http://${req.url}`);
    const search = url.search.replace('?', '');
    return search ? search.split(`${key}=`)[1] : null;
}

// get key from response
utils.getKeyFromResponse = function (response, key) {
   const languages = [];
   for (const item of response.items) {
       if (item[key]) {
        languages.push(
            item[key]
        );
       }
   }
   return languages;
}

// get repos list or count by lang
utils.getRepoListOrCountByLang = function(response, language, count = false) {
    const repos = response.items.filter(item => {
        return item.language && language ? item.language.toLowerCase() === language.toLowerCase() : false;
    });
    return count ? repos.length : repos;
}


// init server
const server = createServer(async (req, res) => {
    // chose the right handler
    const pathName = utils.getPathName(req);
    const chosenHandler = routes[pathName] ? routes[pathName] : routes['notFound'];
    await chosenHandler(req, res);
});


// all apps handlers
const handler = {};

handler.getAllLangsApi = function () {
   return new Promise((resolve, reject) => {
    const url = utils.getURL();
    const options = {
        host: 'api.github.com',
        path: url,
        method: 'GET',
        headers: {'user-agent': 'node.js'}
    };
    const request = https.request(options, function(response){
    let body = '';
    response.on('data', function(chunk){
      body += chunk.toString('utf8');
    });
    
    response.on('end', function(){
      resolve(body);
    });
    response.on('error', function(err) {
        reject(err);
    })
    });
    request.end();
   });
}

// get all languages list handler
handler.getAllLangs = async function (req, res) {
    const allLangsResponse = await handler.getAllLangsApi();
    // set content type
    res.writeHead(200, { 'Content-Type': 'application/json' });    
    const languages = utils.getKeyFromResponse(JSON.parse(allLangsResponse), 'language');
    return res.end(JSON.stringify(languages || []));  
}

// get repos by language
handler.getReposByLang = async function (req, res) {

    const language = utils.getQueryString(req, 'language');
    if (!language) {
        res.writeHead(400, { 'Content-Type': 'application/json' });    
        return res.end(JSON.stringify({
            message: 'BAD REQUEST!',
            info: 'language is missing in search query'
        }));
    }
    const allLangsResponse = await handler.getAllLangsApi();
    const repos = utils.getRepoListOrCountByLang(JSON.parse(allLangsResponse), language);

    res.writeHead(200, { 'Content-Type': 'application/json' });    
    return res.end(JSON.stringify(repos || []));  
}

// get repos count by language
handler.getReposCountByLang = async function (req, res) {

    const language = utils.getQueryString(req, 'language');
    if (!language) {
        res.writeHead(400, { 'Content-Type': 'application/json' });    
        return res.end(JSON.stringify({
            message: 'BAD REQUEST!',
            info: 'language is missing in search query'
        }));
    }
    const allLangsResponse = await handler.getAllLangsApi();
    const count = utils.getRepoListOrCountByLang(JSON.parse(allLangsResponse), language, true);

    res.writeHead(200, { 'Content-Type': 'application/json' });    
    return res.end(JSON.stringify({ count } || []));  
}

// not found handler
handler.notFound = function(req, res) {
    // set content type
    res.writeHead(404, { 'Content-Type': 'application/json' });    
    return res.end(JSON.stringify({
        message: 'Not Found!'
    }));
}

// all app routes
const routes = {
    '/list/languages': handler.getAllLangs,
    '/list/repos': handler.getReposByLang,
    '/list/repos/count': handler.getReposCountByLang,
    'notFound': handler.notFound 
};

// listen to the port
server.listen(PORT, () => {
    console.log(`SERVER IS RUNNING AT PORT ${PORT}`);
});
