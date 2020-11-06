const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const finalData = (res, data) => {
    res.json(data);
    console.log(data.length);
}

const sortFunc = (data, res, finalData) => {
    data.sort((a, b) => {
        return b.count - a.count
    })
    finalData(res, data);
}
const fetch = (rest, url, sortFunc) => {

    let data = [];
    axios.get(url, {
            headers: {
                'Authorization': 'Basic c3JhamFuZzEyMzpjMThjMzNjYjU1ZGExNDY2NTJmNTY0OWFmNDI5NDhjMzVlMjVmMDEx'
            }
        })
        .then(myres => {
            const count = Math.ceil(myres.data.public_repos / 100);
            for (let page = 1; page <= count; page++) {
                url = url + '/repos?per_page=100&page=' + page;
                axios.get(url, {
                        headers: {
                            'Authorization': 'Basic c3JhamFuZzEyMzpjMThjMzNjYjU1ZGExNDY2NTJmNTY0OWFmNDI5NDhjMzVlMjVmMDEx'
                        }
                    })
                    .then(res => {
                        res.data.forEach(e => {
                            //console.log(e);
                            data.push({ 'count': e.forks_count, 'name': e.name });
                        });
                    })
                    .catch(err => {
                        rest.send('Following error has occured: ' + err);
                        return;
                    });
            }
        })
        .catch(err => {
            console.log('Error: ' + err);
        })
    sortFunc(data, rest, finalData);
}
app.get('/', (req, res) => {
    let url = 'https://api.github.com/users/microsoft/repos';
    fetch(res, url, sortFunc);
});
app.get('/api', (req, res) => {
    let url = 'https://api.github.com/orgs/microsoft';
    fetch(res, url, sortFunc);
})
app.listen(5000, console.log('Server Running'));