const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const sendData = (res, data) => {
    res.json(data);
}
const finalData = async(res, data, n, m, sendData) => {
    let i = 0;
    for (let ii = 0; ii < n; ii++) {
        i++;
        data[ii]["committees"] = Object.entries(await getCommittees(data[ii].name, m)).sort((a, b) => {
            return b[1] - a[1];
        }).slice(0, m);
        if (i == n)
            sendData(res, data);
    }
}

const sortFunc = (data, res, n, m, finalData) => {
    data.sort((a, b) => {
        return b.count - a.count
    })
    finalData(res, data, n, m, sendData);
}
const getCommittees = (repo, m) => {

    return new Promise((resolve, reject) => {
        let arr = {};
        let i = 0;
        axios.get('https://api.github.com/repos/microsoft/' + repo + '/commits', {
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
                console.log('Error in code' + err);
                reject(err);
            })

    })


}
const send = (url, count, rest, max, n, m, sortFunc) => {
    let data = [];
    for (let page = 1; page <= 1; page++) {
        url = url + '/repos?per_page=100&page=' + page;
        axios.get(url, {
                headers: {
                    'Authorization': 'Basic c3JhamFuZzEyMzpjMThjMzNjYjU1ZGExNDY2NTJmNTY0OWFmNDI5NDhjMzVlMjVmMDEx'
                }
            })
            .then(res => {
                res.data.forEach(e => {
                    data.push({ 'count': e.forks_count, 'name': e.name });
                    if (data.length === 100) {
                        sortFunc(data, rest, Math.min(n, data.length), m, finalData);
                        return;
                    }
                });
            })
            .catch(err => {
                rest.send('Following error has occured: ' + err);
                return;
            });
    }
}
const fetch = (rest, url, n, m, send) => {
    axios.get(url, {
            headers: {
                'Authorization': 'Basic c3JhamFuZzEyMzpjMThjMzNjYjU1ZGExNDY2NTJmNTY0OWFmNDI5NDhjMzVlMjVmMDEx'
            }
        })
        .then(myres => {
            const count = Math.ceil(myres.data.public_repos / 100);
            send(url, count, rest, myres.data.public_repos, n, m, sortFunc);
        })
        .catch(err => {
            console.log('Error: ' + err);
        });
}
app.get('/', (req, res) => {
    let url = 'https://api.github.com/users/microsoft/repos';
    fetch(res, url, sortFunc);
});
app.get('/api', (req, res) => {
    const { org, n, m } = req.query;
    const url = 'https://api.github.com/orgs/' + org;
    fetch(res, url, n, m, send);
})
app.listen(5000, console.log('Server Running'));