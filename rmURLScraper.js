const cheerio = require('cheerio');
var fs = require('fs');
const outcodeMappingData = require('./rightmove-api-master/outcodeData.json');
const request = require('request');
var fs = require('fs');

console.log('Started!');


function downloadPage(urlandoptions) {
    return new Promise((resolve, reject) => {
        request(urlandoptions, (error, response, body) => {
            if (error) reject(error);
            if (response.statusCode != 200) {
                reject('Invalid status code <' + response.statusCode + '>');
            }
            resolve(body);
        });
    });
}

function JSONtoCSV(obj) {
    var csv = "";
    csv += Object.keys(elem[0]).join(',') + '\n';
    obj.forEach(function (elem) {
        var vals = Object.values(elem);
        const csv_row = vals.join(',');
        csv += csv_row + '\n';
        // for (var k in elem) {
        //     csv = csv + elem[k] + ","
        // }
        // csv = csv.slice(0, -1)
        // csv += '\r\n';
    })
    return csv;
}

async function queryByURL() {
    var masterJSONList = [];

    //Load list of outcodes to extract data for
    var outcodeList = fs.readFileSync('TargetOutcodes.txt', 'utf8').split(",");
    console.log('outcode list' + outcodeList);

    //convert the parsed oucode data json file into an array
    const outcodeDataMap = outcodeMappingData.reduce((acc, val) => {
        acc[val.outcode] = val.code;
        return acc;
    }, {});

    //for each outcode for which we want to extract data
    for (let i of outcodeList) {

        var firstRun = true;
        var numPropsRemaining = 0
        var curIndex = 0

        if (firstRun) {
            console.log('outcode' + i.trim() + ';');
        }

        while (firstRun || numPropsRemaining > 0) {

            var options = {
                url: 'http://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=OUTCODE^' + outcodeDataMap[i.trim()] + ((!firstRun) ? '&index=' + curIndex : '')
                    + '&_includeSSTC=on&includeSSTC=true',
                headers: {
                    'User-Agent': 'request',
                    'referer': 'http://www.rightmove.co.uk/'
                }
            }
            console.log(options);

            //Get the webpage. Q: How can we access multiple pages i.e. sometimes the browser limits the number of results to 20 per page
            var pageHTML = null;
            try {
                pageHTML = await downloadPage(options);
                //console.log('SHOULD WORK:');
                //console.log(html);
            } catch (error) {
                console.error('ERROR:');
                console.error(error + 'failed at outcode ' + i.trim() + 'page index ' + curIndex);
            }

            //console.log(pageHTML);
            $ = cheerio.load(pageHTML);

            if (firstRun) {
                var resultCount = parseInt($(".searchHeader-resultCount").text());
                console.log('result count = ' + resultCount)
                numPropsRemaining = resultCount;
                firstRun = false;
            } else {
                numPropsRemaining = numPropsRemaining - 24;
                curIndex = curIndex + 24;
            }

            const script = $('script').eq(2)
            // console.log(script);
            const json = script.html().replace('window.jsonModel =', '')
            const data = JSON.parse(json)['properties'];
            //console.log(data);

            //save the available data: id, address, price, latitude, longitude, bedrooms, propertyType, status i.e. SSTC (soldsubject to contract)/under offer, date added, date reduced | postcode, size
            data.forEach(element => {
                var tempPropObj = {};
                tempPropObj.outcode = i.trim();
                tempPropObj.id = element.id;
                tempPropObj.bedrooms = element.bedrooms;
                tempPropObj.address = element.displayAddress;
                tempPropObj.latitude = element.location.latitude;
                tempPropObj.longitude = element.location.longitude;
                tempPropObj.propertySubType = element.propertySubType;
                tempPropObj.price = element.price.amount;
                tempPropObj.displaySize = element.displaySize;
                tempPropObj.displayStatus = element.displayStatus;
                tempPropObj.firstVisibleDate = element.firstVisibleDate;
                tempPropObj.productLabel = element.productLabel.productLabelText;
                masterJSONList.push(tempPropObj);
            });
            //to check how to keep request timing sensible
            setTimeout(function(){}, 100 + Math.random() * 100);
        }   
    }
    //Sometimes rightmove can block the request e.g. if it feels there are too many. Q: How can we pause and then start the query again?
    //Q: What else can be added here to make it less likely to fail the request?
    var today = todaysDate();
    //console.log(today)
    var jsonString = JSON.stringify(masterJSONList)
    //console.log(csvString)

    fs.writeFile('RightMove Scrape ' + today + '.json', jsonString, 'utf8', function (err) {
        if (err) {
            console.log('Some error occured - file either not saved or corrupted file saved.');
        } else {
            console.log('It\'s saved!');
        }
    });
}
/*
queryByAPI = function () {
   
    //Create a list of outcodes to loop through
    var outcodeList = fs.readFileSync('TargetOutcodes.txt','utf8').split(",");
    //console.log('outcode list' + outcodeList);
    //var outCodeList = outcodeListFile.
    var rmOCMappingFile = fs.readFileSync('rightmove-stcraper-master/outcodeData.json');
    rmOCMappingFile = JSON.parse(rmOCMappingFile);
    for (let i of outcodeList) {
        console.log('outcode' + i.trim() + ';');

        //For each outcode
        //convert outcode to rightmove code
        for (let j of rmOCMappingFile) {
            //console.log('checking' + j.outcode + 'of outcode file');
            if (j.outcode === i.trim()) {
                var options = {
                    url: 'http://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=OUTCODE^' + j.code,
                    headers: {
                        'User-Agent': 'request',
                        'referer': 'http://www.rightmove.co.uk/'
                    }
                }
                console.log(options);
                //break;

                //Get the webpage. Q: How can we access multiple pages i.e. sometimes the browser limits the number of results to 20 per page
                request(options, function(err, resp, body){
                    console.log('Got Page ' + resp.statusCode);
                    //Q: What is $?
                    $ = cheerio.load(body);
                    const script = $('script').eq(2)
                    const json = script.html().replace('window.jsonModel =', '')
                    const data = JSON.parse(json)
                    console.log(data);
                    //$('script').last().each(function (i, e) {
                     //   console.log($(this));
                        
                    //});
                    if($('#searchResultsInput').val()){
                        if((resp.statusCode == 404) && (errCount < 5)){
                            console.log("OUTCODE^"+j.outcode+":error");
                            errCount = errCount + 1;
                        } else {
                            //db.rightmoveCodes.insert({outcode:$('#searchResultsInput').val(),locationIdent:i});
                            //console.log('OUTCODE^'+ j.outcode +":" + $('input[class="input input--full"]').val());
                           
                            
                        } 
                    }
                })
        }
    }
}
*/
queryByURL();


function todaysDate() {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();
    today = mm  + dd + + yyyy;
    return today;
}
//queryBYAPI();
