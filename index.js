//npm module imports
const express = require('express'); //import express for managing server
const axios = require('axios'); //import axios to send get requests
const app = express(); //creating instance of server

const PORT = process.env.PORT || 5000;

//Utility Function For Handling errors. All Errors in the code are passed to this function.
const error = (err, res) => {
    try {
        //storing data to be returned in a temporary variable
        const ret = {
            status: 0, //Status code 0 means an error has occurred
            message: err.message //Contains the message body of the Error
        }
        console.log(ret);
        res.json(ret); //Send response back to client.
    } catch (except) {
        console.log('Headers sent')
    }
};

//Function to return data to client
const sendData = (res, data) => {
    //storing data to be returned in a temporary variable
    res.json({
        status: 1, //Status code 0 means request has been handled successfully
        data: data //Contains the response according to the request
    });
};
//Function to get data from API recursively
const getCommitteesList = async(org, repo, page, resp) => {
    //Returning promise to ensure next step is taken after receiving data
    return new Promise(async(resolve, reject) => {
        //Calling getCommittees which sends result for a particular page
        await getCommittees(org, repo, page, resp)
            //Receiving result in result variable
            .then(async(result) => {
                //Checking whether response received or not
                if (Object.keys(result).length > 0) {
                    //Recusively calling getCommitteesList with incrementing page number
                    await getCommitteesList(org, repo, page + 1, resp)
                        //Receving result in temporary variable and then combining it with result variable
                        .then(tempResult => {
                            //Iterating over all keys of temporary result variable
                            Object.keys(tempResult).forEach(key => {
                                    //If key exists in result then add its value to existing value
                                    if (key in result)
                                        result[key] += tempResult[key];
                                    //If key does not exist in temporary variable then add new ley value pair to result object
                                    else
                                        result[key] = tempResult[key];
                                })
                                //Return the result object after completing the processing
                            resolve(result);
                        });
                    //return result.concat(getCommitteesList(org, repo, page + 1));
                }
                //If no response received then it is base condition for recursion and return empty object
                else
                //Returns empty object
                    resolve({});
            })
            .catch(err => {
                //If error occurs Send error data to error function
                error(err, resp);
                //Rejecting from promise
                reject(err);
            })
    });
}



//Function to get Final Data which is to be returned to client
const finalData = async(res, org, data, n, m, sendData) => {
    //Initialising counter for processing elements of data array
    let i = 0;
    //Running a loop for n elements
    for (let ii = 0; ii < n; ii++) {
        //Incrementing count for each processed element
        i++;
        //Assigning committees to each element by calling getCommitteesList and picking up max m elements from that array by using sort and slicing.
        await getCommitteesList(org, data[ii].name, 1, res).then(results => {
                data[ii]["committees"] = Object.entries(results).sort((a, b) => {
                    //Sorting in decreasing order
                    return b[1] - a[1];
                }).slice(0, m); //Slicing
            })
            .catch(err => {
                //If error occurs Send error data to error function
                error(err, res);
            })

        //When all elements are process callback to sendData function
        if (i == n)
            sendData(res, data);
    }
};
//Function to sort array of repositories in descending order and choosing top n repositories
const sortFunc = (org, data, res, n, m, finalData) => {
    //sorting data array based on number of forks of repository
    data.sort((a, b) => {
        //Sorting in decending order
        return b.count - a.count
    });
    //Callback to finalData after sorting sending only n repositories by slicing
    finalData(res, org, data.slice(0, n), n, m, sendData);
};
//Function to get committees corresponding to given repository
const getCommittees = (org, repo, page, resp) => {
    //Returning a Promise
    return new Promise((resolve, reject) => {
        //JavaScript Object to store committer name and number of commits of that committer as key value pair.
        let arr = {};
        //Sending a get request to https://api.github.com/repos for getting commits
        axios.get('https://api.github.com/repos/' + org + '/' + repo + '/commits?per_page=100&page=' + page, {
                //Sending headers for authorization so as to send 5000 requests per hour to GITHUB API.
                headers: {
                    //Authorization key and Tokenkey as value
                    'Authorization': 'Basic c3JhamFuZzEyMzpjMThjMzNjYjU1ZGExNDY2NTJmNTY0OWFmNDI5NDhjMzVlMjVmMDEx'
                }
            })
            .then(res => {
                //Looping on the array of commits received
                res.data.forEach(e => {
                        //name is the name of committer
                        const name = e.commit.committer.name;
                        //check whether committer is in the arr object
                        if (name in arr) {
                            //if name exists in arr object increment its count of commits by 1
                            arr[name]++;
                        } else {
                            //if name does not exist in arr object assign value of 1 to this committer
                            arr[name] = 1;
                        }
                    })
                    //When all data is traversed and task of this function completed resolve and return through the promise
                resolve(arr);
            })
            .catch(err => {
                //If error occurs Send error data to error function
                error(err, resp);
                //Throw error using promise with help of reject
                reject(err);
            })
    })
};
//Send function to send multiple requests to GitHub API to fetch all repositories
const send = (url, count, rest, max, org, n, m, sortFunc) => {
    //data array to store details of all repositories
    let data = [];
    //Loop to fetch all repositories page wise
    for (let page = 1; page <= count; page++) {
        //custom url with varying page number based on loop variable
        url = url + '/repos?per_page=100&page=' + page;
        //Sending get request to the url
        axios.get(url, {
                //Sending headers for authorization so as to send 5000 requests per hour to GITHUB API.
                headers: {
                    //Authorization key and Tokenkey as value
                    'Authorization': 'Basic c3JhamFuZzEyMzpjMThjMzNjYjU1ZGExNDY2NTJmNTY0OWFmNDI5NDhjMzVlMjVmMDEx'
                }
            })
            .then(res => {
                //Iterating on data received of repositories to fetch and store only required fields
                res.data.forEach(e => {
                    //Adding respository details as count and name to the array data
                    data.push({ 'count': e.forks_count, 'name': e.name });
                    //Check whether all repositories are processed
                    if (data.length === max) {
                        //Callback to sortFunc to sort data and extract top n repositories
                        sortFunc(org, data, rest, Math.min(n, data.length), m, finalData);
                        return;
                    }
                });
            })
            .catch(err => {
                //Send details of error to error Function
                error(err, rest);
            });
    }
};
//Fetch function to evaluate how many times times request should be sent to Github API
const fetch = (rest, url, org, n, m, send) => {
    //send a get request to the given url
    axios.get(url, {
            //Sending headers for authorization so as to send 5000 requests per hour to GITHUB API.
            headers: {
                //Authorization key and Tokenkey as value
                'Authorization': 'Basic c3JhamFuZzEyMzpjMThjMzNjYjU1ZGExNDY2NTJmNTY0OWFmNDI5NDhjMzVlMjVmMDEx'
            }
        })
        .then(myres => {
            //count how many times request should be sent by formula ceil(repos/100) where repos is the number of repositories of the organization
            const count = Math.ceil(myres.data.public_repos / 100);
            //Callback to the send function with calculated count value
            send(url, count, rest, myres.data.public_repos, org, n, m, sortFunc);
        })
        .catch(err => {
            //Sending error data to error function
            error(err, rest);
        });
};

//Get request from client with req as request parameter and res as response parameter
app.get('/api', (req, res) => {
    //Extract organization name, n and m from the query parameters
    const { org, n, m } = req.query;
    //Create URL to that organization on Github
    const url = 'https://api.github.com/orgs/' + org;
    //Call function fetch ot fetch the URL
    fetch(res, url, org, n, m, send);
});
//Handling invalid API access
app.use((req, res) => {
    //storing data to be returned in a temporary variable
    const ret = {
            status: 0, //Status code 0 means an error has occurred
            message: 'Invalid API Access Link' //Contains the message of Invalid access link
        }
        //Sending response with 404 Error
    res.status(404).json(ret);
});
//Creates and listens to the server
app.listen(PORT, console.log(`Server Running on PORT ${PORT}`));