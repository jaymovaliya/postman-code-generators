var expect = require('chai').expect,
  sdk = require('postman-collection'),
  async = require('async'),
  newmanTestUtil = require('../../../../test/codegen/newman/newmanTestUtil'),
  convert = require('../../lib/index').convert,
  getOptions = require('../../lib/index').getOptions,
  sanitize = require('../../lib/util').sanitize,
  parseBody = require('../../lib/parseRequest').parseBody,
  mainCollection = require('./fixtures/testcollection/collection.json');

describe('nodejs unirest convert function', function () {
  var options = {indentCount: 2, indentType: 'Space'},
    testConfig = {compileScript: null, runScript: 'node run.js', fileName: 'run.js'},
    header = '/* eslint-disable */\n';
  async.waterfall([
    function (next) {
      newmanTestUtil.generateSnippet(convert, options, function (error, snippets) {
        if (error) {
          return next(error);
        }
        return next(null, snippets);
      });
    },
    function (snippets, next) {
      snippets.forEach((item, index) => {
        console.log(item.name, 'name');
        it(item.name, function (done) {
          console.log('inside');

          newmanTestUtil.runSnippet(header + item.snippet, index, testConfig,
            function (err, result) {
              if (err) {
                expect.fail(null, null, err);
              }
              if (typeof result[1] !== 'object' || typeof result[0] !== 'object') {
                expect(result[0].toString().trim()).to.include(result[1].toString().trim());
              }
              else {
                expect(result[0]).deep.equal(result[1]);
              }
              return done(null);
            });
        });
      });
      return next(null);
    }
  ]);

  describe('Convert function', function () {
    var request, reqObject, options, snippetArray, line_no;

    it('should return a Tab indented snippet ', function () {
      request = new sdk.Request(mainCollection.item[0].request);
      options = {
        indentType: 'Tab',
        indentCount: 1
      };
      convert(request, options, function (error, snippet) {
        if (error) {
          expect.fail(null, null, error);
          return;
        }

        expect(snippet).to.be.a('string');
        snippetArray = snippet.split('\n');
        for (var i = 0; i < snippetArray.length; i++) {
          if (snippetArray[i] === '\t.headers({') { line_no = i + 1; }
        }
        expect(snippetArray[line_no].charAt(0)).to.equal('\t');
        expect(snippetArray[line_no].charAt(1)).to.equal('\t');
      });
    });

    it('should return snippet with timeout function when timeout is set to non zero', function () {
      request = new sdk.Request(mainCollection.item[0].request);
      options = {
        requestTimeout: 1000
      };
      convert(request, options, function (error, snippet) {
        if (error) {
          expect.fail(null, null, error);
          return;
        }
        expect(snippet).to.be.a('string');
        expect(snippet).to.include('.timeout(1000)');
      });
    });

    it('should return snippet with followRedirect function having ' +
        'parameter false for no follow redirect', function () {
      request = new sdk.Request(mainCollection.item[0].request);
      options = {
        followRedirect: false
      };
      convert(request, options, function (error, snippet) {
        if (error) {
          expect.fail(null, null, error);
          return;
        }
        expect(snippet).to.be.a('string');
        expect(snippet).to.include('.followRedirect(false)');
      });
    });

    it('should return valid code snippet for no headers and no body', function () {
      reqObject = {
        'description': 'This is a sample POST request without headers and body',
        'url': 'https://echo.getpostman.com/post',
        'method': 'POST'
      };
      request = new sdk.Request(reqObject);
      options = {};
      convert(request, options, function (error, snippet) {
        if (error) {
          expect.fail(null, null, error);
          return;
        }
        expect(snippet).to.be.a('string');
        expect(snippet).to.not.include('.headers');
        expect(snippet).to.not.include('.send');
      });
    });
  });

  describe('getOptions function', function () {

    it('should return an array of specific options', function () {
      expect(getOptions()).to.be.an('array');
    });

    it('should return all the valid options', function () {
      expect(getOptions()[0]).to.have.property('id', 'indentCount');
      expect(getOptions()[1]).to.have.property('id', 'indentType');
      expect(getOptions()[2]).to.have.property('id', 'requestTimeout');
      expect(getOptions()[3]).to.have.property('id', 'followRedirect');
      expect(getOptions()[4]).to.have.property('id', 'trimRequestBody');
    });
  });

  describe('parseRequest function', function () {

    it('should return empty string for empty body', function () {
      expect(parseBody(null, ' ', false)).to.equal('');
    });
  });

  describe('Sanitize function', function () {

    it('should return empty string when input is not a string type', function () {
      expect(sanitize(123, false)).to.equal('');
      expect(sanitize(null, false)).to.equal('');
      expect(sanitize({}, false)).to.equal('');
      expect(sanitize([], false)).to.equal('');
    });

    it('should trim input string when needed', function () {
      expect(sanitize('inputString     ', true)).to.equal('inputString');
    });
  });
});
