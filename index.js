const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const error = (err, res) => {
    const ret = {
        status: 0,
        message: err.message
    }
    res.send(ret);
}

const sendData = (res, data) => {
    res.json({
        status: 1,
        data: data
    });

}

const finalData = async(res, org, data, n, m, sendData) => {
    let i = 0;
    for (let ii = 0; ii < n; ii++) {
        i++;
        data[ii]["committees"] = Object.entries(await getCommittees(org, data[ii].name, m)).sort((a, b) => {
            return b[1] - a[1];
        }).slice(0, m);
        if (i == n)
            sendData(res, data);
    }
}

const sortFunc = (org, data, res, n, m, finalData) => {
    data.sort((a, b) => {
        return b.count - a.count
    });
    finalData(res, org, data.slice(0, n), n, m, sendData);
}

const getCommittees = (org, repo, m) => {

    return new Promise((resolve, reject) => {
        let arr = {};
        let i = 0;
        axios.get('https://api.github.com/repos/' + org + '/' + repo + '/commits', {
                headers: {
                    'Authorization': 'Basic c3JhamFuZzEyMzpjMThjMzNjYjU1ZGExNDY2NTJmNTY0OWFmNDI5NDhjMzVlMjVmMDEx'
                }
            })
            .then(res => {
                res.data.forEach(e => {
                    const name = e.commit.author.name;
                    i++;
                    if (name in arr)
                        arr[name]++;
                    else
                        arr[name] = 1;
                })
                resolve(arr);
            })
            .catch(err => {
                error(err, rest);
                reject(err);
            })

    })
}

const send = (url, count, rest, max, org, n, m, sortFunc) => {
    let data = [];
    for (let page = 1; page <= count; page++) {
        url = url + '/repos?per_page=100&page=' + page;
        axios.get(url, {
                headers: {
                    'Authorization': 'Basic c3JhamFuZzEyMzpjMThjMzNjYjU1ZGExNDY2NTJmNTY0OWFmNDI5NDhjMzVlMjVmMDEx'
                }
            })
            .then(res => {
                res.data.forEach(e => {
                    data.push({ 'count': e.forks_count, 'name': e.name });
                    if (data.length === max) {
                        sortFunc(org, data, rest, Math.min(n, data.length), m, finalData);
                        return;
                    }
                });
            })
            .catch(err => {
                return error(err, rest);
            });
    }
}

const fetch = (rest, url, org, n, m, send) => {
    axios.get(url, {
            headers: {
                'Authorization': 'Basic c3JhamFuZzEyMzpjMThjMzNjYjU1ZGExNDY2NTJmNTY0OWFmNDI5NDhjMzVlMjVmMDEx'
            }
        })
        .then(myres => {
            const count = Math.ceil(myres.data.public_repos / 100);
            send(url, count, rest, myres.data.public_repos, org, n, m, sortFunc);
        })
        .catch(err => {
            error(err, rest);
        });
}

app.get('/api', (req, res) => {
    const { org, n, m } = req.query;
    const url = 'https://api.github.com/orgs/' + org;
    fetch(res, url, org, n, m, send);
})

app.listen(5000, console.log('Server Running'));