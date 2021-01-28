'use strict';

// Require dependencies
const http = require('http');
const { parse } = require('url');
const { resolve } = require('path');
const minimatch = require('minimatch');

const Response = require('./response');
const Request = require('./request');

const routes = []; // List of routes

/**
 * Whalefish class
 */

class Whalefish {

  /**
    * Whalefish routing
    * @param {String} path - Route path
    * @param {Function(req:object, res:object):void} callback - Route callback
    * @param {Int} [statusCode] - Status code to return for the route
    * @returns {this}
    */

  route(path, callback, statusCode = 200) {
    routes.push([resolve(parse(path).pathname), callback, statusCode]); // Add route to list of routes

    return this;
  }

  /**
   * Serve the application on a port
   * @param {Int} port - Port to serve on
   * @param {Function(request:object, response:object, status:int)} callback - Callback
   * @returns {this}
   */

  serve(port, callback) {
    let request;
    let response;

    let status = 200;

    /**
     * Send a file to be displayed to the client
     * @param {String} filePath
     * @param {String} [mimeType]
     * @param {Boolean} [displayInline]
     */

    http.createServer((req, res) => {
      // res and req should be accessible outside this callback
      request = req;
      response = res;

      for (let i = 0; i < routes.length; i++) {
        if (minimatch(resolve(parse(req.url).pathname), routes[i][0])) {
          status = routes[i][2];
          routes[i][1](request, new Response(response, status));
          break;
        }
      }
    }).listen(port, () => callback(new Request(request), new Response(response)));

    return this;
  }
}

module.exports = exports = Whalefish;
