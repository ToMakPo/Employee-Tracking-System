require('dotenv').config()
const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 3000
const moment = require('moment');

/// EXPRESS ///
const app = express()
app.use(express.static('public'))
app.use(express.urlencoded())
app.use(express.json())
app.set("view engine", "ejs");

/// ROUTES ///
app.get('/', function (req, res) {
    res.render('home')
})
app.get('/:id', async function (req, res) {
    const id = req.params.id
    const scheduleDate = moment()
    const workedDate = moment()

    const employeeView = await buildEmployeeView(id, scheduleDate, workedDate)

    if (employeeView) {
        res.render('employee', employeeView)
    } else {
        res.render('noEmployee')
    }
})

async function buildEmployeeView(employeeId, scheduledDate, workedDate) {    
    const employee = await Employees.findById(employeeId)
    if (employee == null) return null
    const scheduledShifts = {}
    const scheduledStartOfWeek = scheduledDate.clone().startOf('week')
    const scheduledWeekOf = getWeekOf(scheduledDate)
    let scheduledHours = 0
    for (let d = 0; d < 7; d++) {
        const date = scheduledStartOfWeek.clone().add(d, 'days')
        scheduledShifts[date.format('MMM-DD')] = {
            id: '',
            date: date.format('YYYY-MM-DD'),
            dateDisplay: date.format('MMM D'),
            dow: date.format('dddd'),
            start: '',
            end: '',
            hours: 0
        }
    }
    for (let shift of employee.scheduledShifts) {
        if (shift.weekOf == scheduledWeekOf) {
            const date = moment(shift.date).format('MMM-DD')
            const startDate = shift.startDate ? moment(shift.startDate) : null
            const endDate = shift.endDate ? moment(shift.endDate) : null
            const hours = (startDate && endDate) ? endDate.diff(startDate, 'hours') : 0
            
            scheduledShifts[date].id = shift.id
            scheduledShifts[date].start = startDate ? startDate.format('HH:mm') : ''
            scheduledShifts[date].end = endDate ? endDate.format('HH:mm') : ''
            scheduledShifts[date].hours = hours
            scheduledHours += hours
        }
    }

    const workedShifts = {}
    const workedStartOfWeek = workedDate.clone().startOf('week')
    const workedWeekOf = getWeekOf(workedDate)
    let workedHours = 0
    for (let d = 0; d < 7; d++) {
        const date = workedStartOfWeek.clone().add(d, 'days')
        workedShifts[date.format('MMM-DD')] = {
            display: []
        }
    }
    for (let shift of employee.workedShifts) {
        if (shift.weekOf == workedWeekOf) {
            const startDate = moment(shift.startDate)
            const endDate = moment(shift.endDate)
            const hours = endDate.diff(startDate, 'hours')
            const date = startDate.format('MMM-DD')
            
            workedShifts[date].display.push(startDate.format('HH:mm') + '-' + endDate.format('HH:mm'))
            workedHours += hours
        }
    }

    return {
        name: employee.name,
        phone: employee.phone ? employee.phone.match(/^(\d{3})(\d{3})(\d{4})$/).join('-').substring(11) : '___-___-____',
        role: employee.role,
        startDate: employee.startDate ? moment(employee.startDate).format('YYYY-MM-DD') : '',
        endDate: employee.endDate ? moment(employee.endDate).format('YYYY-MM-DD') : '',
        onShift: employee.activeShift ? true : false,
        scheduled: {
            startOfWeek: scheduledDate.startOf('week').format('MMM Do, YYYY'),
            endOfWeek: scheduledDate.endOf('week').format('MMM Do, YYYY'),
            shifts: scheduledShifts,
            hours: scheduledHours
        },
        worked: {
            startOfWeek: workedDate.startOf('week').format('MMM Do, YYYY'),
            endOfWeek: workedDate.endOf('week').format('MMM Do, YYYY'),
            shifts: workedShifts,
            hours: workedHours
        }
    }
}

function getWeekOf(date) {
    return date.format('GGGG.WW')
}

/// DATABASE APIS ///
const {Employees} = require('./database/connect')

function cleanPhoneNumber(phone) {
    return phone.replace(/\D/g, '')
}

app.get('/api/employees', async function (req, res) {
    if (req.query.id) {
        const employees = await Employees.findById(req.query.id)
        if (employee.phone) employee.phone = employee.phone.match(/^(\d{3})(\d{3})(\d{4})$/).shift().join('-')
        res.json(employees)
        return
    }

    const lookup = {}

    if ('name' in req.query) {
        if (req.query.name[0] == '_') {
            lookup.name = new RegExp(req.query.name.substring(1), 'gi');
        } else {
            lookup.name = new RegExp(`^${req.query.name}$`, 'gi');
        }
    }

    if ('phone' in req.query) {
        if (req.query.phone[0] == '?') {
            lookup.name = new RegExp(cleanPhoneNumber(req.query.phone), 'gi');
        } else {
            lookup.name = cleanPhoneNumber(req.query.phone)
        }
    }

    if ('role' in req.query) {
        lookup.role = req.query.role
    }
    
    if ('start-date' in req.query) {
        lookup.startDate = req.query['start-date']
    } else
    if ('min-start-date' in req.query || 'max-start-date' in req.query) {
        lookup.startDate = {}
        if ('min-start-date' in req.query) {
            lookup.startDate['$gte'] = req.query['min-start-date']
        }
        if ('max-start-date' in req.query) {
            lookup.startDate['$lte'] = req.query['max-start-date']
        }
    }
    
    if ('end-date' in req.query) {
        lookup.endDate = req.query['end-date']
    } else
    if ('min-end-date' in req.query || 'max-end-date' in req.query) {
        lookup.endDate = {}
        if ('min-end-date' in req.query) {
            lookup.endDate['$gte'] = req.query['min-end-date']
        }
        if ('max-end-date' in req.query) {
            lookup.endDate['$lte'] = req.query['max-end-date']
        }
    }

    if ('hourly-pay' in req.query) {
        lookup.startDate = req.query['hourly-pay']
    } else
    if ('min-hourly-pay' in req.query || 'max-hourly-pay' in req.query) {
        lookup.startDate = {}
        if ('min-hourly-pay' in req.query) {
            lookup.startDate['$gte'] = req.query['min-hourly-pay']
        }
        if ('max-hourly-pay' in req.query) {
            lookup.startDate['$lte'] = req.query['max-hourly-pay']
        }
    }

    if ('on-shift' in req.query) {
        if (req.query['on-shift']) {
            lookup.activeShift = {$ne: null}
        } else {
            lookup.activeShift = {$eq: null}
        }
    }

    if (lookup) {
        const employees = await Employees.find(lookup)
        res.json(employees)
        return
    }
    
    const employees = await Employees.find({}) 
    res.json(employees)
})

app.post('/api/employees/insert', async function(req, res) {
    if (req.body.phone) req.body.phone = cleanPhoneNumber(req.body.phone)
    const newEmployee = await Employees.create(req.body)
    res.send(newEmployee)
})

app.post('/api/employees/update', async function(req, res) {
    const {_id, changes} = req.body
    if ('phone' in changes) changes = cleanPhoneNumber(changes.phone)
    const data = await Employees.findByIdAndUpdate({_id}, changes)
    res.send(data)
})

const splitTime = time => time != '' ? time.split(':') : null
app.post('/api/schedule/insert', async function(req, res) {
    const employeeId = req.body.employeeId
    const date = moment(req.body.dateValue)
    const weekOf = getWeekOf(date)

    const startTime = splitTime(req.body.startTime)
    const endTime = splitTime(req.body.endTime)

    const startDate = startTime ? date.clone().add(startTime[0], 'hours').add(startTime[1], 'minutes') : null
    const endDate = endTime ? date.clone().add(endTime[0], 'hours').add(endTime[1], 'minutes') : null

    if (startDate && endDate && startDate.isAfter(endDate)) {
        endDate.add(1, 'day')
    }

    const schedule = { date, weekOf, startDate, endDate }

    const employee = await Employees.findById(employeeId)
    employee.scheduledShifts.push(schedule)
    const data = employee.save()
    
    res.json({
        action: 'insert',
        employee: employee,
        startTime: startDate ? startDate.format('HH:mm') : '',
        endTime: endDate ? endDate.format('HH:mm') : '',
        hours: (startDate && endDate) ? endDate.diff(startDate, 'hours') : 0
    })
})

app.post('/api/schedule/update', async function(req, res) {
    const employeeId = req.body.employeeId
    const shiftId = req.body.shiftId
    const date = moment(req.body.dateValue)

    const startTime = splitTime(req.body.startTime)
    const endTime = splitTime(req.body.endTime)

    const startDate = startTime ? date.clone().add(startTime[0], 'hours').add(startTime[1], 'minutes') : null
    const endDate = endTime ? date.clone().add(endTime[0], 'hours').add(endTime[1], 'minutes') : null

    if (startDate && endDate && startDate.isAfter(endDate)) {
        endDate.add(1, 'day')
    }

    // const employee = await Employees.findById(employeeId)
    // for (let shift in employee.scheduledShifts) {
    //     if (shift.id == shiftId) {
    //         shift.startDate = startDate
    //         shift.endDate = endDate
    //         break
    //     }
    // }
    // employee.save()

    data = await Employees.update({'scheduledShifts.id': shiftId}, {'$set': {
        'scheduledShifts.$.startDate': startDate,
        'scheduledShifts.$.endDate': endDate,
    }})

    
    res.json({
        action: 'update',
        data: data,
        startTime: startDate ? startDate.format('HH:mm') : '',
        endTime: endDate ? endDate.format('HH:mm') : '',
        hours: (startDate && endDate) ? endDate.diff(startDate, 'hours') : 0
    })
})

const server = app.listen(PORT, () => {
    console.info(`App running on http://localhost:${PORT}`)
})