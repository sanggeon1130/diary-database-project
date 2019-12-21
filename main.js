var express = require('express');
var app = express();
var template = require('./lib/template.js');
var bodyParser = require('body-parser');
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var mysql = require('mysql');


app.use(session({
    secret:'abcdefg',
    resave:false,
    saveUninitialized:true,
    store: new FileStore
}))

var connection = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'password',
    database:'diary'
});

connection.connect();


function isUser(request, response){
    if(request.session.is_logined){
        return true;
    }
    else{
        return false;
    }
}

function authStatusUI(request, response){
    var authStatusUI = '<a href = "/login">login</a>'
    if(isUser(request, response)){
        authStatusUI = `${request.session.nickname} | <a href = "/logout">logout</a>`
    }
    return authStatusUI;

}

app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', function(request, response){
    if(isUser(request, response)){
        connection.query(`SELECT * FROM ${request.session.nickname}`,function(err, diaries){
            console.log(diaries);
            var title = "Welcome to your own diary service";
            var list = template.list(diaries);
            var _template = template.html(title,list,'','',authStatusUI(request, response));
            response.send(_template);
        })
        
    }
    else{
        var title = "Welcome";
        var _template = template.html(title,'','Welcome to our page after you login you can enjoy your own diary service!'
        ,'<a href = "/create_account">join us!</a>',authStatusUI(request, response))
        response.send(_template);
    }
    
})


app.get('/create_account', function(request, response){
    var title = "create account!";
    var _template = template.html(title,'',`
       <form action = "/create_account" method = "post">
       <p><input type = "text" name = "id" placeholder = "type your id!"</p>
       <p><input type = "password" name = "password" placeholder = "type your password!"</p>
       <input type = "submit" value = "create account">
       </form>
   
    `,'',authStatusUI(request, response));
    response.send(_template);
   })

app.post('/create_account', function(request, response){
    var post = request.body;
    connection.query(`CREATE TABLE ${post.id} (
        id INT(11) NOT NULL AUTO_INCREMENT,
        title VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        created DATETIME NOT NULL,
        password VARCHAR(100) NULL,
        PRIMARY KEY(id));
        `, function(err, results){
            connection.query(`INSERT INTO ${post.id} (title, description, created, password)
            VALUES('Welcome', 'Guide: Welcome to your own diary service! In here you can write your diary anywhere and anytime please feel free. Thank you!',
            NOW(), '${post.password}')
            `, function(err2, results2){
                response.redirect('/');
            })
                })
 
})

app.get('/topic/:diaryId', function(request, response){
    connection.query(`SELECT * FROM ${request.session.nickname}`, function(err, diaries){
        var list = template.list(diaries);
        connection.query(`SELECT * FROM ${request.session.nickname} WHERE id=${request.params.diaryId}`, function(err2, diary){
            var title = diary[0].title;
            var description = diary[0].description;
            var _template = template.html(title,list,description,`<p><a href = "/create">write a diary!</a></p><p><a href="/update/${request.params.diaryId}">update</a></p>
            <p>
            <form action = "/delete" method = "post">
            <input type = "hidden" name = "deleteId" value = "${request.params.diaryId}">
            <input type = "submit" value = "delete">
            </form>
            </p>`,authStatusUI(request, response));
            response.send(_template);
        })
    })
})

app.get('/create', function(request, response){
    connection.query(`SELECT * FROM ${request.session.nickname}`, function(err, diaries){
        var list = template.list(diaries);
        var title = "Write a diary for today!";
        var _template = template.html(title, list, `
        <form action="/create" method="post">
            <p><input type="text" name="title" placeholder="title"></p>
            <p>
              <textarea name="description" placeholder="description"></textarea>
            </p>
            <p>
              <input type="submit" value = "done!">
            </p>
          </form>
        `,'',authStatusUI(request, response));
        response.send(_template);
    })

})

app.post('/create', function(request, response){
    var post = request.body;
    connection.query(
        `INSERT INTO ${request.session.nickname} (title,description,created) 
         VALUES(?,?,NOW())`,
         [post.title,post.description],
         function(err, results){
           if(err){
             throw err;
           }
           response.redirect(`/topic/${results.insertId}`);
         }
         )
});

app.get('/update/:rowId', function(request, response){
    connection.query(`SELECT * FROM ${request.session.nickname}`, function(err, diaries){
        var list = template.list(diaries);
        connection.query(`SELECT * FROM ${request.session.nickname} WHERE id=${request.params.rowId}`, function(err2, diary){
            var title = "Update!";
            var _template = template.html(title, list, `
        <form action="/update" method="post">
            <p>
            <input type="text" name="title" value=${diary[0].title}>
            </p>
            <p>
              <textarea name="description">${diary[0].description}</textarea>
            </p>
            <p>
            <input type = "hidden" name = "rowId" value=${request.params.rowId}>
            </p>
            <p>
              <input type="submit" value = "update!">
            </p>
          </form>
        `,'',authStatusUI(request, response));
        response.send(_template);
        })
    
    })
})

app.post('/update', function(request, response){
    var post = request.body;
    connection.query(`UPDATE ${request.session.nickname} SET title=?, description=? WHERE id=?`,[post.title, post.description, post.rowId], function(err, results){
        response.redirect(`/topic/${post.rowId}`);
    })
})

app.post('/delete', function(request, response){
    var post = request.body;
    connection.query(`DELETE FROM ${request.session.nickname} WHERE id=?`,[post.deleteId], function(err, results){
        response.redirect('/');
    })
})



app.get('/login', function(request, response){
 var title = "login";
 var _template = template.html(title,'',`
    <form action = "/login" method = "post">
    <p><input type = "text" name = "id" placeholder = "type your id!"</p>
    <p><input type = "password" name = "password" placeholder = "type your password!"</p>
    <input type = "submit" value = "login">
    </form>

 `,'',authStatusUI(request, response));
 response.send(_template);
})

app.post('/login', function(request, response){
    var post = request.body;
    
    connection.query(`SELECT * FROM ${post.id} `, function(err, userInfo){
        if(post.password === userInfo[0].password){
            console.log(userInfo[0].password);
            request.session.is_logined = true;
            request.session.nickname = post.id;
            request.session.save(function(){
                response.redirect('/');
            })
        }
        else{
            response.send('sorry ....something is wrong......')
        }
    })
    
})

app.get('/logout', function(request, response){
    request.session.destroy(function(){
        response.redirect('/');
    })
})


app.listen(5000, function(){
    console.log('port 5000!')
})