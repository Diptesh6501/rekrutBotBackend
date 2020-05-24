const express = require('express');
var bodyParser = require('body-parser');
const multer = require('multer');
const connectMongo = require('./config/connection');
const app = express();
const port = 8080;
const parseResume = require('./services/extractResumeInfo');
const candidate = require('./models/candidate.model');
const routes = require('./routes/index');
const path = require('path');
const utility = require('./services/util');
let fileToBeServed;
let originalFileName;

connectMongo();
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))



// parse application/json
app.use(bodyParser.json())

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(routes);


var storage = multer.diskStorage(
    {
        destination: '../resumes/',
        filename: function (req, file, cb) {
            cb(null, file.originalname);
        }
    }
);

var upload = multer({ storage: storage });

app.post('/parseResume', upload.single('file'), async (req, res) => {
    fileParsedPath = '../resumes/' + req.file.originalname;
    fileToBeServed = req.file.originalname;
    parseResume(req.file.originalname).then((data) => {
        res.json({
            'parsedResumeInformation': JSON.stringify(data)
        });
    }).catch((error) => {
        console.log('errror', error);
    })

});

function findLastSavedCandidate(file) {
    let lastSavedCandidateId = utility.getLastSavedUserId();
    return new Promise(function (resolve, reject) {
        let query = { candidateId: lastSavedCandidateId };
        candidate.findOneAndUpdate(query, { filename: file }, { new: true }, (err, data) => {
            if (err) {
                reject(err)
            }
            resolve(data);
        })
    })

}

// get pdf
app.get('/pdf', (req, res) => {
    let filePath = path.join(__dirname, '../resumes/', fileToBeServed);
    res.sendFile(filePath);
});

app.get('/', (req, res) => {
    res.send(
        "welcome to rekrutBot AI"
    )
})

app.post('/uploadAws', upload.single('file'), (req, res) => {
    originalFileName = req.file.originalname;
    findLastSavedCandidate(originalFileName).then(data => {
        res.json({
            data: data
        })
    })
})



app.listen(port, '0.0.0.0', (err, res) => {
    if (err) {
        console.error(err);
    }
    console.log(`node is running in ${port}`);
});

