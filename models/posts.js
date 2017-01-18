var Post = require('../lib/mongo').Post;
var marked = require('marked');
var CommentModel = require('./comments');

Post.plugin('contentToHtml',{
	afterFind: (posts)=> {
		return posts.map((post)=> {
			post.content = marked(post.content);
			return post;
		});
	},
	afterFindOne: (post)=>{
		if(post){
			post.content = marked(post.content);
		}
		return post;
	}
});

Post.plugin('addCommentsCount',{
	afterFind: (posts)=>{
		return Promise.all(posts.map((post)=>{
			return CommentModel.getCommentsCount(post._id).then((commentsCount)=>{
				post.commentsCount = commentsCount;
				return post;
			});
		}));
	},
	afterFindOne: (post)=>{
		return CommentModel.getCommentsCount(post._id).then((commentsCount)=> {
			post.commentsCount = commentsCount;
			return post;
		});
	},
});

module.exports = {
	//创建一个文章
	create: function create(post){
		return Post.create(post).exec();
	},
	getPostById: (postId)=>{
		return Post
				.findOne({_id: postId})
				.populate({ path: 'author', model: 'User'}) //关联字段
				.addCreatedAt()
				.addCommentsCount()
				.contentToHtml()
				.exec();
	},
	getPosts: (author)=>{
		var query = {};
		if(author){
			query.author = author;
		}
		return Post.find(query)
		.populate({path:'author',model:'User'})
		.sort({_id:-1})
		.addCreatedAt()
		.addCommentsCount()
		.contentToHtml()
		.exec();
	},
	  // 通过文章 id 给 pv 加 1
 	incPv: function incPv(postId) {
    	return Post
      	.update({ _id: postId }, { $inc: { pv: 1 } })
      	.exec();
  	},
  	getRawPostById: function getRawPostById(postId) {
	  return Post
	    .findOne({ _id: postId })
	    .populate({ path: 'author', model: 'User' })
	    .exec();
	},

	// 通过用户 id 和文章 id 更新一篇文章
	updatePostById: function updatePostById(postId, author, data) {
	  return Post.update({ author: author, _id: postId }, { $set: data }).exec();
	},

	// 通过用户 id 和文章 id 删除一篇文章
	delPostById: function delPostById(postId, author) {
	  return Post.remove({ author: author, _id: postId}).exec();
	}
}