let db;

// creates new local indexDB database named budget_tracker with a version of 1.
const request = indexedDB.open('budget_tracker', 1);

// activates when a database's version changes or a database is first connected.
// so this event will run the first time we run this code and create 
// the new_pizza object store.
request.onupgradeneeded = function(event){
    // save reference to the database that was created by the event.
    const db = event.target.result;

    // create object store in the database. Similar to a table in a SQL database
    db.createObjectStore('new_transactions', { autoIncrement: true });
}

request.onsuccess = function(event) {
    // when db is successfully created with its object store 
    // (from onupgradedneeded event above) or simply established a connection, 
    // save reference to db in global variable
    db = event.target.result;

    // check if the app is online
    if(navigator.onLine){
        uploadTransactions();
    }
}

request.onerror = function(event) {
    // log error here
    console.log(event.target.errorCode);
};

// This function will be used in the index.js file's form submission 
// function if the fetch() function's .catch() error method is executed.
// catch is only executed during network failure on a fetch request.
// saves a transaction to indexedDB database
function saveTransactionInOffline(record){
    // have to explicitly open a transaction to add to the database, a temporary
    // connection to the database.
    const transaction = db.transaction(['new_transactions'], 'readwrite');

    const objectStore = transaction.objectStore('new_transactions');
    objectStore.add(record);

    alert('In offline mode, transaction was saved locally. Tracking will refresh when connected to the internet again.')
}

// sends the transactions stored in indexedDB to the mongoDB database
function uploadTransactions(){
    const transaction = db.transaction(['new_transactions'], 'readwrite');

    const objectStore = transaction.objectStore('new_transactions');

    // get all transactions stored in the indexed database.
    const getAll = objectStore.getAll();

    // getAll() is async so have to wait until it is successfully retrieved.
    getAll.onsuccess = function(){
        // At that point, the getAll variable we created above it will have a 
        // result property that's an array of all the data we retrieved.
        if(getAll.result.length > 0){
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                Accept: 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            // after converting response to json
            .then(serverResponse=>{
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }

                const transaction = db.transaction(['new_transactions'], 'readwrite');

                const objectStore = transaction.objectStore('new_transactions');

                objectStore.clear();

                alert("All offline transactions submitted!")
            })
            .catch(err => {
                console.log(err);
            });
        }
    }
}

// listens for internet to be online again
window.addEventListener('online', uploadTransactions);