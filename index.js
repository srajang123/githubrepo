const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const next2 = (el) => {
    console.log(el);
}

const next = (el, next2) => {
    el.sort((a, b) => {
        return b.count - a.count
    })
    next2(el);
}
const solve = (next) => {
    axios.get('https://api.github.com/users/srajang123/repos')
        .then(res => {
            let arr = [];
            res.data.forEach(e => {
                console.log('Repository Name: ' + e.name);
                console.log('Fork Count: ' + e.forks_count + '\n');
                arr.push({ 'count': e.forks_count, 'name': e.name });
            });
            next(arr, next2);
        });
}
app.get('/', (req, res) => {
    solve(next);
});
app.listen(5000, console.log('Server Running'));