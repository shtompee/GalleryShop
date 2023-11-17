import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
import path from "path";
import mysql from "mysql";
import sharp from "sharp";
import fs from "fs";
import cors from "cors";
import nodemailer from "nodemailer";
import SibApiV3Sdk from "sib-api-v3-sdk";
import config from "./config_remote.json" assert { type: "json" };

const app = express();
app.use(cors());

const upload = multer({
  dest: "uploads/",
}); // Destination folder for uploaded files

const dbConfig = {
  host: config.dbConfig.host,
  port: config.dbConfig.port,
  user: config.dbConfig.user,
  password: config.dbConfig.password,
  database: config.dbConfig.database, // Replace with your actual database name
};

const __dirname = path.resolve();

const pool = mysql.createPool(dbConfig);

const truePassword = config.truePassword;

//app.use(express.static("public")); // Serve static files from the "public" directory
app.use(
  express.urlencoded({
    extended: true,
  })
);
console.log(__dirname);

app.use(express.static(path.join(__dirname, "angular-app-folder")));

// Запуск сервера
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); // Добавьте здесь ваши API-маршруты

app.get("/api/data", (req, res) => {
  // Обработка запроса API
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

function getPaginatedData(page, itemsPerPage) {
  const limit = Number(itemsPerPage);
  const offset = Number((page - 1) * itemsPerPage);

  return new Promise((resolve, reject) => {
    const query = `SELECT id,  CONCAT('data:image/jpeg;base64,', TO_BASE64(list_image))  as list_image, name, prod_year, techlogy, paint_size, price, is_purchased FROM painting ORDER BY id ASC LIMIT ? OFFSET ?`;

    pool.getConnection((error, connection) => {
      if (error) {
        reject(error);
        return;
      }

      connection.query(query, [limit, offset], (error, results) => {
        connection.release(); // Важно освободить соединение после выполнения запроса

        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  });
}

function getPaginatedCount() {
  return new Promise((resolve, reject) => {
    const query = `SELECT COUNT(*) AS total FROM painting`;

    pool.getConnection((error, connection) => {
      if (error) {
        reject(error);
        return;
      }

      connection.query(query, (error, results) => {
        connection.release(); // Важно освободить соединение после выполнения запроса

        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  });
}

async function getProdcutsWrapper(page, itemsPerPage) {
  try {
    const [{ total }] = await getPaginatedCount();

    const productList = await getPaginatedData(page, itemsPerPage);

    const prodcutsWrapper = {
      total: total,
      productList: productList,
    };

    return JSON.stringify(prodcutsWrapper);
  } catch (error) {
    console.error("Произошла ошибка:", error);
    return JSON.stringify({
      error: "Произошла ошибка при получении данных",
    });
  }
}

app.get("/products/productDetail/:id", async (req, res) => {
  try {
    res.header("Content-Type", "application/json");
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.header("Access-Control-Allow-Methods", "GET, POST");

    const id = req.params.id;

    const productDetail = await getProductDetail(id);

    let zaza = JSON.stringify(productDetail);

    res.send(zaza);
  } catch (error) {
    console.error("Произошла ошибка:", error);
    res.status(500).json({
      error: "Произошла ошибка на сервере",
    });
  }
});

function getProductDetail(id) {
  return new Promise((resolve, reject) => {
    const query = `SELECT id, CONCAT('data:image/jpeg;base64,', TO_BASE64(full_image)) as list_image, name, prod_year, techlogy, paint_size, price, is_purchased FROM painting WHERE id = ?`;

    pool.getConnection((error, connection) => {
      if (error) {
        reject(error);
        return;
      }

      connection.query(query, [Number(id)], (error, results) => {
        connection.release(); // Важно освободить соединение после выполнения запроса

        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  });
}

app.get("/products/productImage/:id", async (req, res) => {
  try {
    res.header("Content-Type", "image/jpeg");
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.header("Access-Control-Allow-Methods", "GET, POST");

    const id = req.params.id;

    const productImage = await getProductImage(id);
    res.send(productImage);
  } catch (error) {
    console.error("Произошла ошибка:", error);
    res.status(500).json({
      error: "Произошла ошибка на сервере",
    });
  }
});

function getProductImage(id) {
  return new Promise((resolve, reject) => {
    const query = `SELECT list_image FROM painting WHERE id = ?`;

    pool.getConnection((error, connection) => {
      if (error) {
        reject(error);
        return;
      }

      connection.query(query, [Number(id)], (error, results) => {
        connection.release(); // Важно освободить соединение после выполнения запроса

        if (error) {
          reject(error);
        } else {
          resolve(results[0].list_image);
        }
      });
    });
  });
}

function removeProducts(id, password) {
  if (password === truePassword) {
    return new Promise((resolve, reject) => {
      const query = `DELETE FROM painting WHERE id = ?`;

      pool.getConnection((error, connection) => {
        if (error) {
          reject(error);
          return;
        }

        connection.query(query, [Number(id)], (error, results) => {
          connection.release();

          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
        });
      });
    });
  } else {
    return Promise.reject("Неправильный пароль");
  }
}

app.delete("/products/remove/:id", async (req, res) => {
  try {
    res.header("Content-Type", "application/json");
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );

    const id = req.params.id;
    const password = req.query.password;

    // Вызовем функцию removeProducts и обработаем успешный результат или ошибку
    removeProducts(id, password)
      .then(() => {
        res.send({
          message: "Product has been removed successfully.",
        });
      })
      .catch((error) => {
        console.error("Произошла ошибка:", error);
        res.status(401).json({ error: "Неправильный пароль" });
      });
  } catch (error) {
    console.error("Произошла ошибка:", error);
    res.status(500).json({
      error: "Произошла ошибка на сервере",
    });
  }
});

app.put("/products/edit/:id", function (req, res) {
  const id = req.params.id;
  const password = req.query.password;
  const isProductPurchased = req.body["isProductPurchased"] === "true" ? 1 : 0;

  if (password === truePassword) {
    try {
      const updateQuery = `UPDATE painting SET name=?, prod_year=?, price=?, paint_size=?, techlogy=?,is_purchased=? WHERE id=?`;

      const values = [
        req.body["name"],
        req.body["prod_year"],
        req.body["price"],
        req.body["paint_size"],
        req.body["techlogy"],
        isProductPurchased,
        id,
      ];

      res.header("Content-Type", "application/json");
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
      );

      pool.getConnection((error, connection) => {
        if (error) {
          console.error(
            "Произошла ошибка при подключении к базе данных:",
            error
          );
          res.status(400).json({ error: "Произошла ошибка на сервере" });
        } else {
          connection.query(updateQuery, values, (error, results) => {
            connection.release();
            if (error) {
              console.error("Произошла ошибка при выполнении запроса:", error);
              res.status(400).json({ error: "Произошла ошибка на сервере" });
            } else {
              res.send({
                message: "Элемент успешно обновлен.",
              });
            }
          });
        }
      });
    } catch (error) {
      console.error("Произошла ошибка:", error.message);
      res
        .status(500)
        .json({ error: "Произошла ошибка на сервере" + error.message });
    }
  }
});

app.use(bodyParser.urlencoded({ extended: false })); // Добавьте это middleware
app.use(bodyParser.json()); // Добавьте это middleware

const transporter = nodemailer.createTransport({
  host: config.smtpConfig.host, // Укажите нужный почтовый сервис, например, 'Gmail'
  port: config.smtpConfig.port,
  secure: config.smtpConfig.secure,
  pool: true,
  // service: "smtp.gmail.com",
  auth: {
    user: config.smtpConfig.auth.user, // Ваш адрес электронной почты
    pass: config.smtpConfig.auth.pass, // Пароль от вашей почты
  },
});

// Маршрут для отправки письма
app.post("/products/send-email", (req, res) => {
  const { itemsPrice, itemsName, itemsIds, email, name, message, phone } =
    req.body;
  console.log(req.body);
  const attachments = [];

  itemsIds.forEach((itemId, index) => {
    const idImage = parseInt(itemId); // Преобразуем значение к числовому типу
    if (!isNaN(idImage) && itemsName[index]) {
      // Проверяем, что idImage является числом (не NaN)
      const imageUrl = `http://localhost:3000/products/productImage/${idImage}`;

      attachments.push({
        filename: `${itemsName[index]}.jpg`,
        path: imageUrl,
        cid: `unique-image-id-${idImage}`,
      });
    }
  });

  const itemsNameHTML = itemsName
    .map((itemName) => `<li>${itemName}</li>`)
    .join("");
  const totalAmount = itemsPrice.reduce((acc, price) => acc + price, 0);
  const formattedContactNumber = phone.internationalNumber;
  const mailOptions = {
    from: config.smtpConfig.auth.user,
    to: email,

    bcc: "aminmama8121@gmail.com",
    subject: "Ваш заказ",
    attachments: attachments,
    html: `
    <html>
    <head>
      <style>
        /* Ваши стили здесь */
        body {
          font-family: Arial, sans-serif;
          background-color: #fff; /* Белый фон */
          color: #333; /* Цвет текста */
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        h1 {
          color: #FF5733;
          text-align: center; /* Центрируем текст заголовка */
          margin-bottom: 80px
        }
        p {
          color: #FF5733;
          font-weight: bold;
          text-transform: uppercase;
          font-size: 16px;
          line-height: 1.6;
          color: #555;
          text-align: center;
        }
        ul {
          text-align: center;
          list-style-type: none; /* Убираем маркеры списка */
          padding: 0; /* Убираем отступы вокруг списка */
        }
        ul li {
          font-weight: bold;
          text-transform: uppercase;
          margin: 5px 0; /* Отступы между элементами списка */
          padding: 10px; /* Внутренний отступ для элементов списка */
          background-color: #FFF6EB; /* Фон элемента списка */
          border-radius: 5px; /* Закругленные углы элемента списка */
        }
        /* Дополнительные стили для элементов, если необходимо */
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Здравствуйте ${name}!<br> Благодарю за покупку</h1>
        <p>Ваш заказ:</p>
        <ul>
          ${itemsNameHTML}
        </ul>
        <p>Контактный номер: ${formattedContactNumber}</p>
        <p>Cумма Заказа: ${totalAmount} USD</p>
        <p>Ваше предпочтение к заказу:${message}</p>
      </div>
    </body>
  </html>
`,
  };

  // Отправка письма
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Ошибка отправки письма:", error);
      res.status(500).json({ error: "Ошибка отправки письма" });
    } else {
      console.log("Письмо успешно отправлено:", info.response);
      res.json({ message: "Письмо успешно отправлено" });
    }
  });
});

app.get("/products", async (req, res) => {
  try {
    res.header("Content-Type", "application/json");
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    const page = req.query.page;

    const itemsPerPage = req.query.itemsPerPage;

    const prodcutsWrapper = await getProdcutsWrapper(page, itemsPerPage);

    res.send(prodcutsWrapper);
  } catch (error) {
    console.error("Произошла ошибка:", error);
    res.status(500).json({
      error: "Произошла ошибка на сервере",
    });
  }
});

app.post("/products/upload", upload.single("image"), (req, res) => {
  const { name, prod_year, price, paint_size, techlogy } = req.body;
  const image = req.file;

  // Check if a file was uploaded
  if (!image) {
    res.status(400).send("No file was uploaded.");
    return;
  }

  // Check if the file format is supported
  const supportedFormats = ["image/jpeg", "image/png", "image/gif"];
  if (!supportedFormats.includes(image.mimetype)) {
    res.status(401).send("Unsupported file format.");
    return;
  }

  // Generate thumbnail (list) image

  let listPath = `uploads/${image.filename}-thumbnail.jpg`;
  sharp(image.path)
    .resize(200, 200, {
      fit: "inside",
    })
    .toFormat("jpeg", {
      quality: 100,
    })
    .toFile(listPath, (err) => {
      if (err) {
        console.error("Error generating thumbnail copy:", err);
        res.status(500).send("Internal Server Error");
        return;
      } else {
      }
    });

  let originalPath = `uploads/${image.filename}-original.jpg`;
  sharp(image.path)
    .resize(1000, 1000, {
      fit: "inside",
    })
    .toFormat("jpeg", {
      quality: 100,
    })
    .toFile(originalPath, (err) => {
      if (err) {
        console.error("Error generating original copy:", err);
        res.status(500).send("Internal Server Error");
        return;
      } else {
        const sale_status = 0;
        const queryValues = [
          name,
          prod_year,
          price,
          paint_size,
          sale_status,
          techlogy,
          fs.readFileSync(listPath),
          fs.readFileSync(originalPath),
          new Date(),
        ];

        // Insert data into MySQL database
        pool.getConnection((err, connection) => {
          if (err) {
            console.error("Error connecting to the database:", err);

            return;
          }

          const insertQuery =
            "INSERT INTO painting (name, prod_year, price, paint_size, sale_status, techlogy, list_image, full_image, prod_date) VALUES (?,?,?,?,?,?,?,?,?)";

          connection.query(insertQuery, queryValues, (error, results) => {
            connection.release(); // Release the connection back to the pool

            if (error) {
              console.error("Error executing the SQL query:", error);
              res.status(500).send();
              return;
            }

            res.send("Form submitted and data inserted into the database.");
          });
        });
      }
    });
});

// app.listen(config.dbConfig.appListen, () => {
//   console.log("Server is listening on port 3000");
// });
