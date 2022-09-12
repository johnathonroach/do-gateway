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
		let auth = false;
		if(process.env.MODE === 'key') {
			console.log('Gateway mode KEY');
			if(!req.headers.authorization || !process.env.AUTH){
					return res.json({success: false, message: 'not authorized'});
			}
			auth = bcrypt.compareSync(req.headers.authorization, process.env.AUTH);
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
			next();
			return;
		}

		console.log('Not Authorized');
		return res.json({success: false, message: 'not authorized'});
	}catch(err){
		console.error('An error occurred while authorizing request.', err.message);
		return res.json({success: false, message: 'not authorized'});
	}
})

app.post('/', (req, res, next) => {
	console.log(`Forward to /`);
  userServiceProxy(req, res, next)
})

app.post('/api/v1/:path', (req, res, next) => {
	console.log(`Forward to ${process.env.PROXY_ROUTE}`);
  userServiceProxy(req, res, next)
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
