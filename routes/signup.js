var path = require('path');
var sha1 = require('sha1');
var express = require('express');
var router = express.Router();
var UserModel = require('../models/users');
var checkNotLogin = require('../middlewares/check').checkNotLogin;


var formidable = require('formidable');
var fs = require('fs');

// GET /signup 注册页
router.get('/', checkNotLogin, function(req, res, next) {
  console.log('<><><><><><><>><><>')
  res.render('signup');
});

// POST /signup 用户注册
router.post('/', checkNotLogin, function(req, res, next) {

  var form = new formidable.IncomingForm();   //创建上传表单
    form.parse(req, function(err, fields, files) {
      form.uploadDir = 'public/img/';  //设置上传目录
      form.keepExtensions = true;  //保留后缀
      if (err) {
        req.flash('error',err.message);
        return res.redirect('/signup'); 
      }
      var avatarName;
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
      
        if(extname.length == 0){
            req.flash('error','只支持png和jpg格式图片');
            return res.redirect('/signup');          
        }
    
        avatarName = 'avatar_'+Math.random()+ extname;
        var newPath = form.uploadDir + avatarName;
        console.log(newPath);
        fs.renameSync(tempfilepath, newPath);  //重命名
      };

//处理用户注册信息
      var name = fields.name;
      var gender = fields.gender;
      var bio = fields.bio;
      var avatar = avatarName;
      var password = fields.password;
      var repassword = fields.repassword;

       try{
         if (!(name.length >= 1 && name.length <= 10)) {
            throw new Error('名字请限制在 1-10 个字符');
          }
          if (['m', 'f', 'x'].indexOf(gender) === -1) {
            throw new Error('性别只能是 m、f 或 x');
          }
          if (!(bio.length >= 1 && bio.length <= 30)) {
            throw new Error('个人简介请限制在 1-30 个字符');
          }
          if (!avatar.length>=1 ) {
            throw new Error('缺少头像');
          }
          if (password.length < 6) {
            throw new Error('密码至少 6 个字符');
          }
          if (password !== repassword) {
            throw new Error('两次输入密码不一致');
          }
        }catch(e){
          req.flash('error',e.message);
          return res.redirect('/signup');
        }

        //等待写入数据库 的用户信息
    var user = {
      name: name,
      password: sha1(password),
      gender: gender,
      avatar: avatarName,
      bio: bio 
    };

    UserModel.create(user)
      .then(function(result){
        // 此 user 是插入 mongodb 后的值，包含 _id
        user = result.ops[0];
        // 将用户信息存入 session
        delete user.password;
        req.session.user = user;
        // 写入 flash
        req.flash('success', '注册成功');
        // 跳转到首页
        res.redirect('/posts');
      })
      .catch((e)=>{
         // 用户名被占用则跳回注册页，而不是错误页
        if (e.message.match('E11000 duplicate key')) {
          req.flash('error', '用户名已被占用');
          return res.redirect('/signup');
        }
        next(e);
      });    
  });
});

module.exports = router;