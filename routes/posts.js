var express = require('express');
var router = express.Router();

var PostModel = require('../models/posts');
var CommentModel = require('../models/comments');

var checkLogin = require('../middlewares/check').checkLogin;

var fs = require('fs');
var url = require('url');
var path = require('path');
var formidable = require('formidable');

var SERVER_PATH = 'www.jackyang.cn';
var PORT = '3000';




// GET /posts 所有用户或者特定用户的文章页
//   eg: GET /posts?author=xxx
router.get('/', function(req, res, next) {
  var author = req.query.author;
  PostModel.getPosts(author)
  .then((posts)=>{
    res.render('posts',{posts: posts});
  })
  .catch(next);
});

// POST /posts 发表一篇文章
router.post('/', checkLogin, function(req, res, next) {
  console.log('editor 来啦');
  var author = req.session.user._id;
  var title = req.body.title;
  var content = req.body.content;

  console.log(title);
  console.log(1234567);

  //校验参数
  try{
  	if(!title.length){
  		throw new Error('请填写标题');
  	}
  	if(!content.length){
  		throw new Error('请填写内容');
  	}
  } catch(e){
  	req.flash('error',e.message);
  	return res.redirect('back');
  }

  var post = {
  	author: author,
  	title: title,
  	content: content,
  	pv: 0
  };

  PostModel.create(post)
  	.then((result)=>{
  		//此 post 是插入 mongodb 的值 ，包含 _id
  		post = result.ops[0];
  		req.flash('success','发表成功');
  		res.redirect(`/posts/${post._id}`);
  	})
  	.catch(next);
});


// 文件将要上传到哪个文件夹下面
var uploadfoldername = '../uploadfiles';
var uploadfolderpath = path.join(__dirname, uploadfoldername);

router.get('/editor',(req,res)=>{
  if(req.session.user.name === 'JackYang')
    res.render('./index');
  else
    res.render('./sorry');
});

router.post('/editor',(req,res)=>{
  console.log('上传一点点图');
  // 使用第三方的 formidable 插件初始化一个 form 对象
  var form = new formidable.IncomingForm();
    // 处理 request
    form.parse(req, function (err, fields, files) {
      console.log('wojiushiwo  ...');
      if (err) {
        return console.log('formidable, form.parse err');
      }
      console.log('formidable, form.parse ok');

      // 显示参数，例如 token
      console.log('显示上传时的参数 begin');
      console.log(fields);
      console.log('显示上传时的参数 end');

      var item;

      // 计算 files 长度
      var length = 0;
      for (item in files) {
        length++;
      }
      if (length === 0) {
        console.log('files no data');
        return;
      }

      for (item in files) {
        var file = files[item];
        // formidable 会将上传的文件存储为一个临时文件，现在获取这个文件的目录
        var tempfilepath = file.path;
        // 获取文件类型
        var type = file.type;

        // 获取文件名，并根据文件名获取扩展名
        var filename = file.name;
        var extname = filename.lastIndexOf('.') >= 0
                ? filename.slice(filename.lastIndexOf('.') - filename.length)
                : '';
        // 文件名没有扩展名时候，则从文件类型中取扩展名
        if (extname === '' && type.indexOf('/') >= 0) {
          extname = '.' + type.split('/')[1];
        }
        // 将文件名重新赋值为一个随机数（避免文件重名）
        filename = Math.random().toString().slice(2) + extname;

        // 构建将要存储的文件的路径
        var filenewpath = path.join(uploadfolderpath, filename);
        console.log(filenewpath);
        // 将临时文件保存为正式的文件
        fs.rename(tempfilepath, filenewpath, function (err) {
          // 存储结果
          var result = '';

          if (err) {
            // 发生错误
            console.log('fs.rename err');
            result = 'error|save error';
          } else {
            // 保存成功
            console.log('fs.rename done');
            // 拼接图片url地址
            result = 'http://' + SERVER_PATH +  '/uploadfiles/' + filename;
          }
          
          // 返回结果
          res.writeHead(200, {
            'Content-type': 'text/html'
          });
          res.end(result);
        }); // fs.rename
      } // for in 
    });   
});


// POST /posts 发表一篇文章
router.post('/create', checkLogin, function(req, res, next) {
  var author = req.session.user._id;
  var title = req.body.title;
  var content = req.body.content;
  //校验参数
  try{
    if(!title.length){
      throw new Error('请填写标题');
    }
    if(!content.length){
      throw new Error('请填写内容');
    }
  } catch(e){
    req.flash('error',e.message);
    return res.redirect('back');
  }
  var post = {
    author: author,
    title: title,
    content: content,
    pv: 0
  };

  PostModel.create(post)
    .then((result)=>{
      console.log('wo post le');
      //此 post 是插入 mongodb 的值 ，包含 _id
      post = result.ops[0];
      req.flash('success','发表成功');
      res.setHeader('Access-Control-Allow-Origin','*');
      res.redirect(`/posts/${post._id}`);
    })
    .catch(next);
});


router.post('/uploadfiles',(req,res,next)=>{
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
  });

// GET /posts/create 发表文章页
router.get('/create', checkLogin, function(req, res, next) {
  res.render('create');
});



// GET /posts/:postId 单独一篇的文章页
router.get('/:postId', function(req, res, next) {
  var postId = req.params.postId;
  Promise.all([
    PostModel.getPostById(postId), // 获取文章信息
    CommentModel.getComments(postId), //获取该文章所有留言
    PostModel.incPv(postId)// pv 加 1
    ])
   .then((result)=>{
       var post = result[0];
       var comments = result[1];
       if(!post){
          throw new Error('该文章 不存在');
       }
       res.render('post',{
          post: post,
          comments:comments
        });
   })
   .catch(next);
});

// GET /posts/:postId/edit 更新文章页
router.get('/:postId/edit', checkLogin, function(req, res, next) {
  var postId = req.params.postId;
  var author = req.session.user._id;

  PostModel.getRawPostById(postId)
    .then(function (post) {
      if (!post) {
        throw new Error('该文章不存在');
      }
      if (author.toString() !== post.author._id.toString()) {
        throw new Error('权限不足');
      }
      res.render('edit', {
        post: post
      });
    })
    .catch(next);
});

// POST /posts/:postId/edit 更新一篇文章
router.post('/:postId/edit', checkLogin, function(req, res, next) {
  var postId = req.params.postId;
  var author = req.session.user._id;
  var title = req.body.title;
  var content = req.body.content;

  PostModel.updatePostById(postId, author, { title: title, content: content })
    .then(function () {
      req.flash('success', '编辑文章成功');
      // 编辑成功后跳转到上一页
      res.redirect(`/posts/${postId}`);
    })
    .catch(next);
});

// GET /posts/:postId/remove 删除一篇文章
router.get('/:postId/remove', checkLogin, function(req, res, next) {
  var postId = req.params.postId;
  var author = req.session.user._id;
  PostModel.getPostById(postId)
  .then((post)=>{
    if(author === '583292f1281fdf0e2475bea2'|| author === post.author._id){
      PostModel.delPostById(postId, post.author._id)
      .then(function () {
        req.flash('success', '删除文章成功');
        // 删除成功后跳转到主页
        res.redirect('/posts');
      })
      .catch(next);
    }else{
      req.flash('error', '删除文章error');
      res.redirect('/posts');
    }
  })
});

// POST /posts/:postId/comment 创建一条留言
router.post('/:postId/comment', checkLogin, function(req, res, next) {
  var author = req.session.user._id;
  var postId = req.params.postId;
  var content = req.body.content;
  var comment = {
    author: author,
    postId: postId,
    content: content
  };

  CommentModel.create(comment)
    .then(()=>{
      req.flash('success','留言成功');
      res.redirect('back');
    })
    .catch(next);
});

// GET /posts/:postId/comment/:commentId/remove 删除一条留言
router.get('/:postId/comment/:commentId/remove', checkLogin, function(req, res, next) {
  var commentId = req.params.commentId;
  var author = req.session.user._id;

  CommentModel.delCommentById(commentId, author)
    .then(function () {
      req.flash('success', '删除留言成功');
      // 删除成功后跳转到上一页
      res.redirect('back');
    })
    .catch(next);
});

module.exports = router;