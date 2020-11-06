const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const finalData = (res, data) => {
    res.json(data);
}

const sortFunc = (data, res, finalData) => {
    data.sort((a, b) => {
        return b.count - a.count
    })
    finalData(res, data);
}
const fetch = (rest, sortFunc) => {
    axios.get('https://api.github.com/users/srajang123/repos')
        .then(res => {
            let data = [];
            res.data.forEach(e => {
                data.push({ 'count': e.forks_count, 'name': e.name });
            });
            sortFunc(data, rest, finalData);
        })
        .catch(err => {
            rest.send('Following error has occured: ' + err.errno)
        })
}
app.get('/', (req, res) => {
    fetch(res, sortFunc);
});
app.listen(5000, console.log('Server Running'));