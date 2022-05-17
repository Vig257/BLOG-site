const express = require("express")
const ejs = require("ejs");
const path = require('path');
const mysql = require("mysql")
var bodyParser = require('body-parser')


const app = express();

app.set('view engine', "ejs");
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())



const db = mysql.createPool({
    connectionLimit: 100,
    host: "127.0.0.1",       //This is your localhost IP
    user: "newuser",         // "newuser" created in Step 1(e)
    password: "Password1#",  // password for the new user
    database: "blog",      // Database name
    port: "3306"             // port name, "3306" by default
})
db.getConnection((err, connection) => {
    if (err) throw (err)
    console.log("DB connected successful: " + connection.threadId)
})


//add blog routes CRUD ---->create
app.get('/', (req, res) => {
    res.render("index")
})
app.post('/', async (req, res) => {
    const username = req.body.name;
    const blog = req.body.blog
    db.getConnection(async (err, connection) => {
        if (err) throw (err)
        const sqlSearch = "SELECT * FROM posts WHERE author = ?"
        const search_query = mysql.format(sqlSearch, [username])
        const sqlInsert = "INSERT INTO posts VALUES (0,?,?)"
        const insert_query = mysql.format(sqlInsert, [blog, username])
        // ? will be replaced by values
        // ?? will be replaced by string
        await connection.query(search_query, async (err, result) => {
            if (err) throw (err)

            console.log("------> Search Results")
            console.log(result.length)
            if (result.length != 0) {
                connection.release()
                console.log("------> Username already exists")
                res.sendStatus(409)
            }
            else {
                await connection.query(insert_query, (err, result) => {
                    connection.release()
                    if (err) throw (err)
                    console.log("--------> Created new blog")
                    console.log(result.insertId)
                    res.sendStatus(201)
                })
            }
        }) //end of connection.query()
    }) //end of db.getConnection()

})
//view routes CRUD---->READ
app.get('/blogList', (req, res) => {
    db.getConnection(async (err, connection) => {
        if (err) throw (err)
        const sqlSearch = "Select * from posts"
        const search_query = mysql.format(sqlSearch)
        await connection.query(search_query, async (err, result) => {
            connection.release()

            if (err) throw (err)
            if (result.length == 0) {
                console.log("--------> table does not exist")
                res.sendStatus(404)
            }
            else {
                console.log(result);
                res.render("blogs", { data: result })
            }
            //end of User exists i.e. results.length==0
        }) //end of connection.query()
    }) //end of db.connection()
})

//update blog  CRUD----------> UPDATE
app.get('/blogList/edit/:id',(req,res)=>{
    let UserId= req.params.id;
      let sql=`SELECT * FROM posts WHERE id=${UserId}`;
      db.query(sql, function (err, data) {
        if (err) throw err;
       
        res.render('users-form', { title: 'User List', editData: data[0]});
      });
})
app.post('/blogList/edit/:id',(req,res)=>{
    let id= req.params.id;
    let updateData=req.body;
    let sql = `UPDATE posts SET ? WHERE id= ?`;
    db.query(sql, [updateData, id], function (err, data) {
    if (err) throw err;
    console.log(data.affectedRows + " record(s) updated");
  });
  res.redirect('/blogList');
})



//delete blog route CRUD---->DELETE
app.get("/blogList/:id", (req, res) => {
    let id = req.params.id
    db.query('DELETE FROM posts WHERE id = ?',
        id,
        function (err, data) {
            if (err) throw err;
            console.log(data.affectedRows + " record(s) updated");
        });
    res.redirect('/blogList');

})
app.listen(3001, () => {
    console.log("server running at http://localhost:3001")
})
