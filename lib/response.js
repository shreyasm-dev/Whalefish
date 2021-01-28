'use strict';

const isValid = require('is-valid-path');
const { isAbsolute, basename } = require('path');
const { createReadStream, statSync, existsSync } = require('fs');
const { getType } = require('mime');
const { Readable } = require('stream');

/**
 * Used internally inside Whalefish as the res parameter
 */

let response;
let status;

class Response {
  constructor(res, statusCode) {
    response = res;
    status = statusCode;
  }

  /**
   *
   * @param {string} filePath - Absolute path of file to send
   * @param {string} [mimeType] - Mime type of file
   * @param {boolean} [displayInline] - Tells the client whether the content should be displayed or downloaded
   * @returns {this}
   */

  sendFile(filePath, mimeType, displayInline = true) {
    if (!isValid(filePath)) { // Path is not valid
      throw new Error(`${filePath} is an invalid path`);
    } else if (!isAbsolute(filePath)) { // Path is not absolute
      throw new Error('The file path must be absolute');
    } else if (!existsSync(filePath)) { // Path doesn't exists
      throw new Error(`Path ${filePath} does not exist`);
    } else if (!statSync(filePath).isFile()) { // Path is a folder
      throw new Error(`${filePath} is a folder`);
    }

    if (!mimeType) { // Mime type is not set
      if (basename(filePath).split(/\./g).length < 2) { // File doesn't have an extension
        response.writeHead(status, {
          'Content-Type': 'application/octet-stream', // Default mime type
          'Content-Disposition': displayInline ? 'inline' : `attachment; filename="${basename(filePath)}"`, // Should the file be displayed or downloaded?
          'Content-Length': statSync(filePath).size,
        });

        createReadStream(filePath).pipe(response);
      } else {
        response.writeHead(status, {
          'Content-Type': (getType(filePath) || 'application/octet-stream'),
          'Content-Disposition': displayInline === true ? 'inline' : `attachment; filename="${basename(filePath)}"`, // Should the file be displayed or downloaded?
          'Content-Length': statSync(filePath).size,
        });

        createReadStream(filePath).pipe(response);
      }
    } else {
      response.writeHead(status, {
        'Content-Type': mimeType,
        'Content-Disposition': displayInline ? 'inline' : `attachment; filename="${basename(filePath)}"`, // Should the file be displayed or downloaded?
        'Content-Length': statSync(filePath).size,
      });

      createReadStream(filePath).pipe(response);
    }

    return this;
  }

  /**
   * Send some text to be displayed to the client
   * @param {...string} text - Text to be sent
   * @returns {this}
   */

  send(...text) {
    Readable.from(...text).pipe(response);
    return this;
  }

  /**
   * Set a header
   * @param {string} name - Header name
   * @param {string} value - Header value
   * @returns {this}
   */

  setHeader(name, value) {
    response.setHeader(name, value);
    return this;
  }

  /**
   * Get the value of a header
   * @param {string} name - Header name
   * @returns {*}
   */

  getHeader(name) {
    return response.getHeader(name);
  }

  /**
   * Get all headers
   * @returns {object}
   */

  getHeaders() {
    return response.getHeaders();
  }

  /**
   * Check if a header exists
   * @param {*} name - Header name
   * @returns {boolean}
   */

  hasHeader(name) {
    return response.hasHeader(name);
  }

  /**
   * Remove/unset a header
   * @param {string} name - Header name
   * @returns {this}
   */

  removeHeader(name) {
    response.removeHeader(name);
    return this;
  }
}

module.exports = Response;
