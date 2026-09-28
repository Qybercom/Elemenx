import {describe,expect,it} from 'vitest';
import fs from 'fs';
import http from 'http';
import os from 'os';
import path from 'path';
import {createRequire} from 'module';

var require=createRequire(import.meta.url);
var Server=require('../../tools/server.js');

function request (port,method,headers) {
	return new Promise(function (resolve,reject) {
		var req=http.request({host:'127.0.0.1',port:port,path:'/',method:method || 'GET',headers:headers || {}},function (response) {
			var chunks=[];
			response.on('data',function (chunk) { chunks.push(chunk); });
			response.on('end',function () { resolve({Status:response.statusCode,Headers:response.headers,Body:Buffer.concat(chunks)}); });
		});
		req.on('error',reject);
		req.end();
	});
}

function withServer (options,callback) {
	return new Promise(function (resolve,reject) {
		var server=Server.Create(options);
		server.Listen(0,'127.0.0.1',function () {
			var port=server.Server.address().port;
			Promise.resolve(callback(port)).then(function (value) {
				server.Close(function () { resolve(value); });
			},function (error) {
				server.Close(function () { reject(error); });
			});
		});
	});
}

describe('Elemenx production server',function () {
	it('emits cache validators and Cache-Control and answers conditional GET with 304',async function () {
		var root=fs.mkdtempSync(path.join(os.tmpdir(),'elemenx-server-'));
		fs.writeFileSync(path.join(root,'index.html'),'<main>production</main>');
		try {
			await withServer({Root:root,CacheControl:'public, max-age=60'},async function (port) {
				var first=await request(port,'GET');
				expect(first.Status).toBe(200);
				expect(first.Headers['cache-control']).toBe('public, max-age=60');
				expect(first.Headers.etag).toBeTruthy();
				var second=await request(port,'GET',{'If-None-Match':first.Headers.etag});
				expect(second.Status).toBe(304);
				expect(second.Body.length).toBe(0);
			});
		}
		finally { fs.rmSync(root,{recursive:true,force:true}); }
	});

	it('answers HEAD without sending the file body',async function () {
		var root=fs.mkdtempSync(path.join(os.tmpdir(),'elemenx-server-head-'));
		var body='<main>head</main>';
		fs.writeFileSync(path.join(root,'index.html'),body);
		try {
			await withServer({Root:root},async function (port) {
				var result=await request(port,'HEAD');
				expect(result.Status).toBe(200);
				expect(Number(result.Headers['content-length'])).toBe(Buffer.byteLength(body));
				expect(result.Body.length).toBe(0);
			});
		}
		finally { fs.rmSync(root,{recursive:true,force:true}); }
	});
});