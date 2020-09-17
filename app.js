var express          = require('express'),
    bodyParser       = require('body-parser'),
    expressSanitizer = require('express-sanitizer'),
    mongoose         = require('mongoose'),
    passport         = require('passport'),
    LocalStrategy    = require('passport-local'),
    User             = require('./models/user'),
    methodOverride   = require('method-override'),
    app              = express()

    
    
mongoose.connect('mongodb://localhost:27017/spider',
{ useUnifiedTopology: true,
  useNewUrlParser: true,
  useFindAndModify: false
})


app.set('view engine','ejs')
app.use(bodyParser.urlencoded({extended: true}));
// app.use(expressSantizer());



app.use(express.static('./public'))
app.use(methodOverride('_method'))
app.use(function(req,res,next){
    res.locals.currentUser = req.user;
    next();
      
})


//To configure the passport 
app.use(require('express-session')({ 
    secret: 'This is my backend project',
    resave: false,
    saveUninitialized:false

}))



app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// mongoose model config
var blogSchema = new mongoose.Schema({ 
    title:String, 
    image:String,
    body:String,
    created:
    {
        type:Date,
         default:Date.now
        
        }

})

var Blog = mongoose.model('Blog',blogSchema)

//Search form
app.get('/blogs', function(req, res){ 
	if(req.query.search){ 
		const regex = new RegExp(escapeRegex(req.query.search) ,'gi');
		Blog.find({title:regex},function(err,blogs){ 
			if(err){ 
				console.log(err);
			 } else{ 
				 var noMatch;
				 if(blogs.length<1){ 
					 noMatch = "No match found try again..";
				  }
				 res.render('index',{blogs:blogs,noMatch:noMatch});
			  }
		 });

	 } else { 
		 Blog.find({},function(err,blogs){ 
			 if(err){
				 console.log(err);
			   } else { 
				   res.render('index',{blogs:blogs});
			    }
		  })
	  }

 })


//restful routers
app.get('/',function(req,res){  
    res.render('front')
})



// index route
app.get('/blogs',function(req,res){
    Blog.find({}, function(err,blogs){ 
        if(err){ 
            console.log(err)
        } else{ 
            res.render('index',{blogs:blogs});

        }
    })
   
})


// new routes
app.get('/blogs/new',function(req,res){ 
    res.render('new')
})



// Create Routes
app.post('/blogs',function(req,res){ 
    //create blog post
    //r edirect to index.html

    // req.body.blog.body = req.sanitize(req.body.blog.body)
    Blog.create(req.body.blog, function(err,newBlog){ 
        if(err){ 
            res.render('new');
        } else { 
            res.redirect('/blogs')

        }
    })

})

//show routes
app.get('/blogs/:id', function(req, res){
    Blog.findById(req.params.id,function(err,foundBlog){ 
        if(err){ 
            res.redirect('/blogs')
        } else{ 
            res.render('show',{blog:foundBlog})

        }
    })
})

app.get('/blogs/:id/edit',function(req,res){ 
    Blog.findById(req.params.id,function(err,foundBlog){
        if(err){ 
            res.redirect('/blogs')

        } else{ 
            res.render('edit',{blog:foundBlog})
        }
     })

    
})

//put route
//THis is to put all the information inn the show page after it has been ediited
app.put('/blogs/:id',function(req,res){ 
    Blog.findByIdAndUpdate(req.params.id, req.body.blog ,function(err,updatedBlog){ 
        if(err){ 
            res.redirect('/blogs')
        } else { 
            res.redirect('/blogs/'+ req.params.id)
        }
    
    })
    
})
// Delete Routes
app.delete('/blogs/:id', function (req, res){ 
    // destroy blog list
    Blog.findByIdAndRemove(req.params.id,function(err){
        if(err){ 
            res.redirect('/blogs')
        } else { 
            res.redirect('/blogs')

        }

    })
})
//=======================================================
// auth routes
app.get('/register', function (req, res){ 
    res.render('register')
})

app.post('/register', function (req, res){ 
    var newUser = new User({username:req.body.username});
    User.register(newUser,req.body.password,function(err,user){ 
        if(err){ 
            console.log(err)
            return res.render('register'); 
        } 
        passport.authenticate('local')(req,res,function(){ 
            res.redirect('/blogs');
        }) 

    })
    
})

//show login format
app.get('/login',function(req,res){ 
    res.render('login')
})

// handling login logic
app.post('/login',passport.authenticate('local',{ 
    sucessRedirect:'/blogs',
    failureRedirect:'/login'
 }),function(req,res){ 
     
 })


 //logout route
 app.get('/logout', function(req,res){ 
     req.logout();
     res.redirect('/blogs');
 })

function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){ 
        return next();
    }
    res.redirect('/login')
 } 







 function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};


app.listen(3000,function(){  
    console.log('The server is listening...')
})
