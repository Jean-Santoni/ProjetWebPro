let express = require('express');
let app = express();
let sessions = require('express-session');
let fileSystem = require('fs');

const https = require('https');
const fs = require('fs');
let mysql =require('mysql');
let cookieParser = require('cookie-parser');
const path = require('path');

// Chemins vers votre clé privée et certificat
const privateKey = fs.readFileSync(path.join(__dirname, 'certs', 'key.pem'), 'utf8');
const certificate = fs.readFileSync(path.join(__dirname, 'certs', 'cert.pem'), 'utf8');

const credentials = { key: privateKey, cert: certificate };

app.use(express.static(path.join(__dirname, '/css')));
app.use(express.static(path.join(__dirname, '/pages')));
app.use(express.static(path.join(__dirname, '/img')));
app.use(express.urlencoded({ extended: true })) ;
app.use(cookieParser());
app.use(express.json());
//session
app.use(sessions({
    secret: "secretkeyfhrgfgrfrty84fwir767",
    saveUninitialized:true,
    cookie: { maxAge: 1000*60*60*2 },
    resave: false
}));

//BDD
let db = mysql.createConnection({
    host : 'localhost',
    user: 'root',
    password: '',
    database: 'bdProjet',
});


//routage
app.get('/index.html', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});


app.get('/cookie.html', function(req, res){
    fileSystem.readFile(__dirname+'/cookie.html', 'utf-8', function(err,data){
        
        if (err) throw err;

        res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
        data =data.replace('{{cookie}}',req.cookies.cookieCreer); 
        res.end(data);
    });
});



app.get('/Annonce.html', function(req, res){
    if( req.session.login != undefined){
        fileSystem.readFile(__dirname+'/Annonce.html', 'utf-8', function(err,data){
            if (err) throw err;
    
            res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
            data =data.replace('{{login}}',req.session.login); 
            res.end(data);
        });
    }else{ 
            res.redirect('/index.html');
    }
});

app.post('/ajaxAnnonce.html',function(req, res){
    //console.log(db.state);
    if(db.state == "disconnect"){
         db.connect(function(err){
            if(err){
                throw err;
            }
           //console.log("Connecté à la base de données MySQL!");

            db.query("SELECT * FROM annonce", function(err, result){
                if (err){
                    db.end;
                    throw err;
                }
                
                if(result != undefined){
                    res.json(result);
                    db.end;
                }
                db.end;
            })
        })
    }else{
        db.query("SELECT * FROM annonce", function(err, result){
            if (err){
                db.end;
                throw err;
            }
            
            if(result != undefined){
                res.json(result);
                db.end;
            }
            db.end;
        })
    }
    //res.sendFile(__dirname + '/pages/Annonce.html');
    
});

app.post('/cookieCreation.html', function(req, res){
    res.cookie('cookieCreer', 'Vous avais un cookie');
    res.send('Cookie creé')
});

app.post('/cookieSup.html', function(req, res){
    res.clearCookie('cookieCreer');
    res.send('/cookie.html');
});

db.connect(function(err){
    app.post('/session.html', function(req, res){
        if(err){
            throw err;
        }
        //console.log("Connecté à la base de données MySQL!");
        let login = req.body.login;
        
        db.query("SELECT login FROM user Where login = ?", login, function(err, result){
            if (err){
                db.end;
                throw err;
            }
            
            if(result[0] != undefined){
                req.session.login = login;
                //console.log(req.session);
                db.end;
                res.send('/Annonce.html');
            }else{
                console.log('Pas de compte');
                db.end;
                res.send('/index.html');
            }
            })
    });
   
});

app.get('/supSession.html', function(req, res){
    if( req.session.login != undefined){
        console.log('suppresion');
        req.session.destroy();
    }
    res.send('/index.html');
});



// routage par défaut
app.get('*', function(req, res){
    res.redirect('/index.html');
   });
   
// Création du serveur HTTPS
const httpsServer = https.createServer(credentials, app);

httpsServer.listen(3000, () => {
  console.log('HTTPS Server running on port 3000');
});
