# ALMABASE Internship Task
## TASK
Find the n most popular repositories of a given organization on Github based on the number of forks. For each such repo find the top m committees and their commit counts. 

## API working
* API receives a request in the form: /api?org={ORGNAIZATION NAME}&n={VALUE OF n}&m={VALUE OF m}
* Then the API sends a request to https://api.github.com/orgs/{ORGANIZATION}
* From the response received, it extracts the total number of repositories present in that organization.
* GitHub API is limited to maximum 100 respository list per page because of pagination. So we need to count how many times server will have to request github to get all repository. This number is: ceil(NUMBER_OF_REPOSITORIES/100);
* Now the server knows how many times it has to send the request to Github. These requests are sent in a loop to https://api.github.com/orgs/{ORGANIZATION}/repos?per_page=100&page={i}. 
* The response received is stored into an array of Objects with the format:
<br/>
    {
        <br/>
        count:COUNT_OF_FORKS_OF_REPO,
        <br/>
        name:REPO_NAME
        <br/>
    }

* This array object is sorted in descending order of count values and top n repositories are extracted.
* The extracted top n repositories are then again processed and with each element extra key of committees is added. This is done by sending API requests to https://api.github.com/repos/{ORGANIZATION}/{REPO_NAME}/commits and counting the number of times each user has committed to that repo. 
<br/>
The final format of each objects in Array becomes:
<br/>
{
    <br/>
        count:COUNT_OF_FORKS_OF_REPO,
        <br/>
        name:REPO_NAME,
        <br/>
        committees:[{
            COMMITTER_NAME1:COMMITTER_COUNT1
        },{
            COMMITTER_NAME2:COMMITTER_COUNT2
        }....]
        <br/>
}

* The array corresponding to commiitees is then sorted in descending order of number of comits by each commiter and top m committers are selected.
* This final response is then sent as JSON response.

## Managing the large data received
Management of large amount of data is done through two ways:
* <b>Usage of different functions and callbacks.</b>
While receiving data from GitHub API, callback is called only when all data has been received. whether all data has been received is checked by counting how many received have been received and what is the total count of repositories. 

* <b>Using Promises</b>
After receiving all commiter data from API data is returned to the calling function.

## API Data Return Format
* It returns data in JSON format.
* The format is:
<br/>
<b>In case of error:</b>
<br/>
    {
        <br/>
        status: 0,
        <br/>
        message:ERROR_MESSAFE_CODE
        <br/>
    }
<br/>
<b>In case of no error:</b>
    <br/>
    {
        <br/>
        status: 1,
        <br/>
        data:FINAL_DATA
        <br/>
    }

## Code
### npm modules used
* <b>express </b>- To create and manage the server
* <b>axios - </b>To Send Requests to Github API

## How to Run locally
### Requirements
* git client installed on the system
* Node.js version 12.13.1
* API testing tool: Browser or Postman or ny other tool.
### Steps
* Create a new folder on your system.
* Migrate to that folder in the terminal.
* Run `git clone https://github.com/srajang123/githubrepo`. This will clone the repo to your system.
* Run `npm install`. This will install all the required modules locally on your system.
* Run `node index` and the server will start.
* Goto your browser or Postman or any other tool and goto URL: 'http://localhost:5000/api?org={ORGANIZATION_NAME}&n={VALUE_OF_n}&m={VALUE_OF_m}'.
* You will receive the results.