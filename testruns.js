var obj = [
    {id : '1', type : 'saloon, red', colour : 'red', year : '1981'},
    {id : '2', type : 'saloon', colour : 'red', year : '1981'},
    {id : '3', type : 'saloon', colour : 'red', year : '1981'},
    {id : '4', type : 'saloon', colour : 'red', year : '1981'}
]

var newobj =[];

obj.forEach(function (element){
    var el = {};
    el.id = element.id;
    el.year = element.year;
    newobj.push(el);
})

var csv = '';

function JSONtoCSV(obj) {
    var csv = "";
    csv += Object.keys(obj[0]).join(',') + '\n';
    obj.forEach(function (elem) {
        var vals = Object.values(elem);
        const csv_row = vals.join('\t');
        csv += csv_row + '\n';
        // for (var k in elem) {
        //     csv = csv + elem[k] + ","
        // }
        // csv = csv.slice(0, -1)
        // csv += '\r\n';
    })
    return csv;
}

console.log(JSONtoCSV(obj));