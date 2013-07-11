#!/usr/bin/env node

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = 'index.html';
var CHECKSFILE_DEFAULT = 'checks.json';

var assertFileExists = function(infile) {
    var instr = infile.toString();

    if (!fs.existsSync(instr)) {
	console.log("%s does not exists. Exiting.", instr);
	process.exit(1);
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var cheerioUrl = function (url, checksfile) {
    rest.get(url).on('complete', function(result, response) {
        if (result instanceof Error) {
            console.error("Location %s couldn't be reached", url);
            process.exit(1);
        }
	var r = new Buffer(result);
	var checkJson = checkHtmlStream(r, checksfile);
	var outJson = JSON.stringify(checkJson, null, 4);
	console.log(outJson); 
    });
};

var checkHtmlStream = function(buffer, checksfile) {
    $ = cheerio.load(buffer);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for (var ii in checks) {
	var present = $(checks[ii]).length > 0;
	out[checks[ii]] = present;
    }
    return out;
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for (var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <file_url>', 'URL location for index.html')
        .parse(process.argv);

    if (program.url != null) {
        console.log("Loading Url: " + program.url);
        cheerioUrl(program.url, program.checks);
    } else {
        var checkJson = checkHtmlFile(program.file, program.checks);
        var outJson = JSON.stringify(checkJson, null, 4);
        console.log(outJson);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}



