module.exports = function (app) {
  app.get('/', function (req, res) {
    res.redirect('/posts');
  });
  app.use('/signup', require('./signup'));
  app.use('/signin', require('./signin'));
  app.use('/signout', require('./signout'));
  app.use('/posts', require('./posts'));

  app.use('/editor',require('./editor'));
  app.use('/uploadfiles',(req,res,next)=>{
    var url = require('url');
    var path = require('path');
    var fs = require('fs');
    console.log('1234567');
    console.log(1);
    var pathname = url.parse(req.url).pathname;
    console.log(2);
    var filepath = path.join(__dirname, '../uploadfiles/'+pathname);
    console.log(filepath);
    fs.readFile(filepath, function (err, file) {
      if (err) {
        return next();
      }
      if (filepath.slice(filepath.lastIndexOf('.') - filepath.length) === '.css') {
        // 兼容IE
        res.writeHead('200', {'Content-type': 'text/css'});
      } else {
        res.writeHead('200');
      }
      console.log('response file success: ' + filepath);
      res.end(file);
    });
  })

  app.use((req,res)=> {
    console.log(req.url);
  	if (!res.headersSent) {
  		res.render('404');
  	}
  });
};