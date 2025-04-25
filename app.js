let express = require('express')
let app = express()

let {open} = require('sqlite')
let sqlite3 = require('sqlite3')

let path = require('path')
let dbPath = path.join(__dirname, 'covid19India.db')
let db = null

app.use(express.json())

let initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server running...')
    })
  } catch (error) {
    console.log('Connecting to db Failed')
    process.exit(1)
  }
}

initializeDBAndServer()

//api 1
app.get('/states/', async (request, response) => {
  let query = `select * from state;`
  let result = await db.all(query)
  let queryData = result.map(obj => {
    return {
      stateId: obj.state_id,
      stateName: obj.state_name,
      population: obj.population,
    }
  })
  response.send(queryData)
})

//api 2
app.get('/states/:stateId/', async (request, response) => {
  let {stateId} = request.params
  let query = `select * from state where state_id = ${stateId};`
  let data = await db.get(query)
  // data could be undefined if the query wont return ans in db
  if (data === undefined) {
    response.send('No Data Found in Database')
  } else {
    let obj = {
      stateId: data.state_id,
      stateName: data.state_name,
      population: data.population,
    }
    response.send(obj)
  }
})

// api 3
app.post('/districts/', async (request, response) => {
  let data = request.body
  let {districtName, stateId, cases, cured, active, deaths} = data
  let query = `insert into district(district_name,state_id,cases,cured,active,deaths) values('${districtName}',${stateId},${cases},${cured},${active},${deaths});`
  await db.run(query)
  response.send('District Successfully Added')
})

//api 4
app.get('/districts/:districtId/', async (request, response) => {
  let {districtId} = request.params
  let query = `select * from district where district_id = ${districtId};`
  let data = await db.get(query)
  if (data === undefined) {
    response.send('Data not Found in Database')
  } else {
    let obj = {
      districtId: data.district_id,
      districtName: data.district_name,
      stateId: data.state_id,
      cases: data.cases,
      cured: data.cured,
      active: data.active,
      deaths: data.deaths,
    }
    response.send(obj)
  }
})

//api 5
app.delete('/districts/:districtId/', async (request, response) => {
  let {districtId} = request.params
  let query = `delete from district where district_id = ${districtId};`
  await db.run(query)
  response.send('District Removed')
})

//api 6
app.put('/districts/:districtId/', async (request, response) => {
  let {districtId} = request.params
  let reqBody = request.body
  let {districtName, stateId, cases, cured, active, deaths} = reqBody
  let query = `update district set district_name = '${districtName}',state_id = ${stateId}, cases = ${cases}, cured = ${cured}, active = ${active}, deaths = ${deaths} where district_id = ${districtId};`
  await db.run(query)
  response.send('District Details Updated')
})

//api 7
app.get('/states/:stateId/stats/', async (request, response) => {
  let {stateId} = request.params
  let query = `select sum(cases) as totalCases, sum(cured) as totalCured, sum(active) as totalActive, sum(deaths) as totalDeaths from district where state_id = ${stateId};`
  let data = await db.get(query)
  response.send(data)
})

//api 8
app.get('/districts/:districtId/details/', async (request, response) => {
  let {districtId} = request.params
  let query = `select state.state_name as stateName from state join district on state.state_id = district.state_id where district.district_id = ${districtId};`
  let data = await db.get(query)
  response.send(data)
})
module.exports = app
