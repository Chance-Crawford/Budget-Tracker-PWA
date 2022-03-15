const FILES_TO_CACHE = [
    // since index.html is in the same folder as this service worker file,
    // sometimes there has to be a / separately from it so that the offline caching
    // can work correctly.
    "/",
    "index.html",
    "./css/styles.css",
    "./js/index.js",
    "./js/idb.js",
    "../routes/api.js"
];  

const APP_PREFIX = 'BudgetTracker-';     
const VERSION = 'version_01';
const CACHE_NAME = APP_PREFIX + VERSION;

self.addEventListener('install', function(e){
    e.waitUntil(
        // Use caches.open to find the specific cache by name, then 
        // add every file in the FILES_TO_CACHE array to the cache.
        caches.open(CACHE_NAME).then(function (cache) {
          console.log('installing cache : ' + CACHE_NAME)
          return cache.addAll(FILES_TO_CACHE)
        })
    );
});

self.addEventListener('activate', function(e) {
    e.waitUntil(
      caches.keys().then(function(keyList) {
        let cacheKeeplist = keyList.filter(function(key) {
          return key.indexOf(APP_PREFIX);
        });
        cacheKeeplist.push(CACHE_NAME);
  
        return Promise.all(
          keyList.map(function(key, i) {
            if (cacheKeeplist.indexOf(key) === -1) {
              console.log('deleting cache : ' + keyList[i]);
              return caches.delete(keyList[i]);
            }
            else {
                console.log('file is not cached, fetching : ' + e.request.url)
                return fetch(e.request)
            }
          })
        );
      })
    );
});

//  retrieve information from the cache.
self.addEventListener('fetch', function (e) {
    console.log('fetch request : ' + e.request.url);

    e.respondWith(
      caches.match(e.request).then(function (request) {
        if (request) { // if cache is already stored and available to be retrieved, respond with cache
          console.log('responding with cache : ' + e.request.url)
          return request;
        } else {       // if there are no cache, try fetching request
          console.log('file is not cached, fetching : ' + e.request.url)
          return fetch(e.request);
        }
  
      })
    )
});