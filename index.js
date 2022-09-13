const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const dotenv = require('dotenv')
const httpProxy = require('express-http-proxy')
const bcrypt = require('bcryptjs');

dotenv.config()
const userServiceProxy = httpProxy(process.env.PROXY_PATH)

// Authentication
app.use((req, res, next) => {
	try{
		console.log('Request Headers:', req.headers);
		console.log('Request URL:', req.url || 'not set');
		let auth = false;
		if(process.env.MODE === 'api_key') {
			console.log('Gateway mode API KEY');
			if(!req.headers.authorization || !process.env.AUTH){
					return res.json({success: false, message: 'not authorized'});
			}
			auth = bcrypt.compareSync(req.headers.authorization, process.env.AUTH);
		}
		if(process.env.MODE === 'header_key') {
			console.log('Gateway mode HEADER KEY');
			const key = process.env.HEADER_KEY;
			const val = process.env.HEADER_VALUE;
			if(!key || !val){
					return res.json({success: false, message: 'not authorized'});
			}
			console.log(`Header Key: ${key} ${val}`)
			console.log({
				'header key': req.headers[key],
				'env': {
					'key': process.env.HEADER_KEY,
					'val': process.env.HEADER_VALUE
				}
			});
			auth = req.headers[key] && req.headers[key] === val;
		}
		if(process.env.MODE === 'bless') {
			console.log('Gateway mode BLESS');
			const blessed = process.env.BLESSED_URLS.split(',');
			console.log(`Blessed URLs: ${blessed}`)
			if(!process.env.BLESSED_URLS){
					return res.json({success: false, message: 'not authorized'});
			}
			const referer = req.headers.referer;
			const xForwardedFor = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',') : [];
			console.log(`Referral URL: ${referer}`)
			console.log(`X-Forwarded-For IPs: ${xForwardedFor}`)
			auth = blessed.includes(referer);

			if(!auth && xForwardedFor) {
				console.log('Authorizing X-Forwarded-For', xForwardedFor);
				auth = xForwardedFor.some(r => blessed.includes(r));
			}
		}

		if(auth) {
			console.log('Authorized');
			userServiceProxy(req, res, next);
			return;
		}

		console.log('Not Authorized');
		return res.json({success: false, message: 'not authorized'});
	}catch(err){
		console.error('An error occurred while authorizing request.', err.message);
		return res.json({success: false, message: 'not authorized'});
	}
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
