const express = require('express')
const spawn = require('child_process').spawn
const fileUpload = require('express-fileupload')
const db = require('./database')
require('dotenv').config()
const User = require('./models/User')
const Log = require('./models/Log')
const bcrypt = require('bcryptjs')

const cookieParser = require('cookie-parser')

const app = express()
app.use(express.static('public'))
app.use(fileUpload())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser())

// connection to db
db.initDb()

//requests

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/public/login.html')
})
app.get('/signup', (req, res) => {
  res.sendFile(__dirname + '/public/signup.html')
})

app.get('/settings', (req, res) => {
  res.sendFile(__dirname + '/public/settings.html')
})

app.post('/login', async (req, res) => {
  const { username, password } = req.body
  try {
    let user = await User.findOne({
      username,
    })

    if (!user)
      return res
        .status(404)
        .json({ status: 404, message: 'Väärä käyttäjänimi tai salasana' })
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res
        .status(404)
        .json({ status: 404, message: 'Väärä käyttäjänimi tai salasana' })
    }
    res.cookie('username', user.username)
    res.cookie('tax', user.taxPercentage)
    res.cookie('wage', user.hourlyWage)

    res.status(200).json({ status: 200, message: 'Kirjautuminen onnistui' })
  } catch {
    return res.status(500).json({
      message: 'Jotain meni pieleen',
    })
  }
})

app.post('/signup', async (req, res) => {
  console.log(req.body)
  const { username, password, wage, tax } = req.body

  let user = await User.findOne({ username: username })

  if (user)
    return res.status(400).json({
      message: 'Käyttäjänimi on jo käytössä',
    })
  let newUser = new User({
    username: username,
    password: password,
    taxPercentage: tax,
    hourlyWage: wage,
  })

  const salt = await bcrypt.genSalt(10)
  newUser.password = await bcrypt.hash(password, salt)

  await newUser.save()
  res.status(200).json({
    status: 200,
    message: 'Käyttäjä luotu onnistuneesti',
  })
})

app.post('/settings', async (req, res) => {
  const { wage, tax } = req.body
  let username = req.cookies['username']
  await User.findOneAndUpdate(
    { username: username },
    { hourlyWage: Number(wage), taxPercentage: Number(tax) }
  )
  res.cookie('tax', tax)
  res.cookie('wage', wage)
  res.status(200).json({
    status: 200,
    message: 'Muutokset tallennetu',
  })
})

app.get('/logged', (req, res) => {
  if (!req.user) {
    res.redirect('/')
  }
  res.sendFile(__dirname + '/public/calculator.html')
})

app.get('/', (req, res) => {
  if (req.user) {
    res.redirect('/logged')
  }
  res.sendFile(__dirname + '/public/calculator.html')
})

let pdf
let uploadPath
let output
let tax
let wage

app.post(
  '/',
  (req, res, next) => {
    pdf = req.files.pdf
    uploadPath = req.body.name
    tax = req.body.tax
    wage = req.body.wage

    // save file to server to wait for handling (filename as path)
    pdf.mv(uploadPath, function (err) {
      if (err) return res.status(500).send(err)
    })

    next()
  },
  function (req, res, next) {
    // spawn child process to execute python script
    const python = spawn('python3', ['tyko.py', uploadPath, wage, tax])

    // collect data from script
    python.stdout.on('data', function (data) {
      console.log('Executing python script')

      output = data
    })
    // if error on python script
    python.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`)
    })
    // in child_process close event send output as response
    python.on('close', (code) => {
      console.log(`Python script executed with code: ${code}`)

      // log convert to database
      json_output = JSON.parse(output)
      if (json_output.other.wasValidFile) {
        Log.findByIdAndUpdate(
          '6166db4319041439e9adccfd',
          { $inc: { converts: 1 } },
          { new: true },
          (err, response) => {
            if (err) {
              console.error(err)
            } else {
              console.log(
                'Convert logged, total converts: ' + response.converts
              )
            }
          }
        )
      }
      res.status(200).send(output)
      console.log('Response sent')
    })
  }
)

app.get('/logout', (req, res) => {
  res.clearCookie('username')
  res.clearCookie('tax')
  res.clearCookie('wage')
  res.redirect('/')
})

app.listen(process.env.PORT || 5000)
