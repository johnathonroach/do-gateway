const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const dotenv = require('dotenv')
const httpProxy = require('express-http-proxy')
const bcrypt = require('bcryptjs');

dotenv.config()
const userServiceProxy = httpProxy(process.env.FILL_PDF_API_ENDPOINT)

// Authentication
app.use((req, res, next) => {
  if(!req.headers.authorization || !process.env.AUTH){
      return res.json({success: false, message: 'not authorized'});
  }

  const auth = bcrypt.compareSync(req.headers.authorization, process.env.AUTH);
  if(auth) {
    next()
    return;
  }

  return res.json({success: false, message: 'not authorized'});
})

app.post('/api/v1/:path', (req, res, next) => {
  userServiceProxy(req, res, next)
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
