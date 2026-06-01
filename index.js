import express from "express";
import cookieParser from "cookie-parser";
import argon2 from "argon2";
import db_ops from './db_operations.js';

const port = process.env.port || 8000;
const app = express();
const secret = process.env.secret;
const pepper = process.env.pepper;
if (secret == null || pepper == null) {
    console.error("Env variables are missing, run 'npm run gen_env'");
    process.exit(1);
}
const HASH_PARAMS = {
    secret: Buffer.from(pepper, "hex")
}
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded());
app.use(cookieParser(secret));

function admin_check(req, res, username) {
    username = req.signedCookies["Account"];
    if (username != undefined) {
        const user_db = db_ops.select_user.get(username);
        if (user_db != undefined) {
            return user_db.admin === 1 || user_db.admin === "1";
        }
    }
    return false;
}

app.get("/", (req, res) => {
    let username = req.signedCookies["Account"];
    const mname = db_ops.select_info.get();
    res.render("names", {
        name: "Subsites", 
        mname: mname.name,
        aname: "About the museum",
        accname: "Accounts",
        user: username,
        admin: admin_check(req, res, username)
    })
});

app.get("/about", (req, res) => {
    let username = req.signedCookies["Account"];
    const data = db_ops.select_info.get();
    if (data != null) {
        res.render("about", {
            name: "About Us", 
            data: data,
            user: username,
            admin: admin_check(req, res, username)
        });
    } else {
        res.sendStatus(404);
    }
});

app.get("/tankmuseum", (req, res) => {
    const username = req.signedCookies["Account"];
    const info = db_ops.select_info.get();
    const data = db_ops.select_tanks.all();
    if (info != undefined) {
        res.render("tanks", {
            name: "List of tanks", 
            name2: info.name,
            data: data,
            user: username,
            admin: admin_check(req, res, username)
        });
    } else {
        res.sendStatus(404);
    }
});

app.post("/tankmuseum/new", (req, res) => {
    const tanks = db_ops.select_tanks.all();
    const username = req.signedCookies["Account"];
    let added = 0;
    for (const tank of tanks) {
        if (tank.nation == req.body.nation && tank.name == req.body.name) {
            db_ops.increase_number.run(req.body.number, username, tank.id);
            added = 1;
            break;
        } 
    }
    if (added == 0) {
        db_ops.insert_tank.run(req.body.nation, req.body.name, req.body.number, username);
    }
    
    res.redirect('/tankmuseum');
});

app.get("/tankmuseum/edit", async (req, res) => {
    let username = req.signedCookies["Account"];
    const data = db_ops.select_tanks.all();
    if (data != undefined) {
        if (username != undefined) {
            const user_db = db_ops.select_user.get(username);
            res.render("edit", {
                name: "List of tanks", 
                data: data,
                user: username, 
                admin: admin_check(req, res, username)
            });
        } else {
            res.render("edit", {
                name: "List of tanks",
                data: data,
                user: username,
                admin: admin_check(req, res, username)
            });
        }
    } else {
        res.sendStatus(404); 
    }
});

app.post("/tankmuseum/edit/new", (req, res) => {
    const username = req.signedCookies["Account"];
    if(username != undefined) {
        if (req.body.action == "delete") {
            db_ops.delete_tank.run(req.body.id);
            res.redirect('/tankmuseum/edit');
        }
        else if (req.body.action == "update") {
            db_ops.update_tank.run(req.body.nation, req.body.name, req.body.number, username, req.body.id);
            res.redirect('/tankmuseum/edit');
        }
        else if (req.body.action == "noadmin") {
            res.redirect("/tankmuseum/edit/noadmin");
        }
    } else {
        res.redirect("/tankmuseum/edit/noadmin");
    }
});

app.get("/tankmuseum/edit/noadmin", (req, res) => {
    const username = req.signedCookies["Account"];
    res.render("noadmin", {
        name: "No admin privileges",
        user: username,
        admin: admin_check(req, res, username)
    });
});

app.get("/account", (req, res) => {
    let username = req.signedCookies["Account"];
    if (username == undefined || username == null) {
        res.render("account", {
            name: "Account",
            user: username,
            error: undefined,
            admin: admin_check(req, res, username)
        })
    } else {
        res.render("account_logged", {
            name: "Account",
            user: username,
            admin: admin_check(req, res, username)
        })
    }
});

app.post("/account/signup", async (req, res) => {
    if (!req.signedCookies["Account"]) {
        const username = req.body.username?.trim();
        const password = req.body.password;
        const admin = req.body.admin === "1" ? 1 : 0;

        if (!username || username.length < 4 || username.length > 20) {
            res.render("account", {
                name: "Account",
                user: undefined,
                error: "Username must be 4 to 20 characters long.",
                admin: admin_check(req, res, username)
            });
            return;
        }

        const user_db = db_ops.select_user.get(username);

        if (user_db != undefined) {
            console.log("Username already exists");
            res.render("account", {
                name: "Account",
                user: undefined,
                error: "Username already exists.",
                admin: admin_check(req, res, username)
            });
            return;
        } 
        else {
            if (!password || password.length < 4 || password.length > 100) {
                res.render("account", {
                    name: "Account",
                    user: undefined,
                    error: "Password must be 4 to 16 characters long.",
                    admin: admin_check(req, res, username)
                });
                return;
            } else {
                let passwordhash = await argon2.hash(password, HASH_PARAMS);
                db_ops.insert_user.run(username, passwordhash, admin);
                res.redirect("/account");
            }
        }
    }
});
app.post("/account/login", async (req, res) => {
    const username = req.body.login_username;
    const password = req.body.login_password;
    const user_db = db_ops.select_user.get(username);
    if (user_db != undefined && user_db != null) {
        if (await argon2.verify(user_db.passwordhash, password, HASH_PARAMS)) {
            res.cookie("Account", username, { maxAge: 3600000, signed: true, httpOnly: true });
            res.redirect("/account");
        }
        else {
            res.redirect("/account");
        }
    }
    else {
        res.redirect("/account");
        console.log("Failed to log in");
    }
});
app.post("/account/logout", (req, res) => {
    res.clearCookie("Account");
    res.redirect("/account");
})


app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});