const {Employees} = require('./database/connect')
const moment = require('moment');

function cleanPhoneNumber(phone) {
    return phone.replace(/\D/g, '')
}

function getWeekOf(date) {
    return date.clone().add(1, 'day').format('GGGG.WW')
}

function splitTime(time) {
    return time != '' ? time.split(':') : null
}

module.exports = function(app) {
    app.get('/api/employees', async function (req, res) {
        if ('id' in req.query) {
            const employees = await Employees.findById(req.query.id)
            if ('phone' in employee) employee.phone = employee.phone.match(/^(\d{3})(\d{3})(\d{4})$/).shift().join('-')
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

        const employees = await Employees.find(lookup)
        
        res.json(employees)
    })

    app.post('/api/employees/insert', async function(req, res) {
        if (req.body.phone) req.body.phone = cleanPhoneNumber(req.body.phone)
        const newEmployee = await Employees.create(req.body)
        res.json(newEmployee)
    })

    app.post('/api/employees/update', async function(req, res) {
        const {_id, ...changes} = req.body

        if ('phone' in changes) changes.phone = cleanPhoneNumber(changes.phone)

        const data = await Employees.findByIdAndUpdate({_id}, changes)
        res.json(data)
    })

    app.post('/api/employees/delete', async function(req, res) {
        const data = await Employees.deleteOne(req.body)
        res.json(data)
    })

    app.post('/api/scheduled/insert', async function(req, res) {
        const employeeId = req.body.employeeId
        const date = moment.utc(req.body.dateValue)
        const weekOf = getWeekOf(date)

        const startTime = splitTime(req.body.startTime)
        const endTime = splitTime(req.body.endTime)

        const startDate = startTime ? date.clone().add(startTime[0], 'hours').add(startTime[1], 'minutes') : null
        const endDate = endTime ? date.clone().add(endTime[0], 'hours').add(endTime[1], 'minutes') : null

        if (startDate && endDate && startDate.isAfter(endDate)) {
            endDate.add(1, 'day')
        }

        const employee = await Employees.findById(employeeId)
        employee.scheduledShifts.push({ date, weekOf, startDate, endDate })
        employee.save()
        
        const shiftId = employee.scheduledShifts.slice(-1)[0]._id
        
        res.json({
            action: 'insert',
            section: 'scheduled',
            employee: employee,
            shiftId,
            startTime: startDate ? startDate.format('HH:mm') : '',
            endTime: endDate ? endDate.format('HH:mm') : '',
            hours: (startDate && endDate) ? endDate.diff(startDate, 'hours', true) : 0
        })
    })

    app.post('/api/scheduled/update', async function(req, res) {
        const employeeId = req.body.employeeId
        const shiftId = req.body.shiftId
        const date = moment.utc(req.body.dateValue)

        const startTime = splitTime(req.body.startTime)
        const endTime = splitTime(req.body.endTime)

        const startDate = startTime ? date.clone().add(startTime[0], 'hours').add(startTime[1], 'minutes') : null
        const endDate = endTime ? date.clone().add(endTime[0], 'hours').add(endTime[1], 'minutes') : null

        if (startDate && endDate && startDate.isAfter(endDate)) {
            endDate.add(1, 'day')
        }

        data = await Employees.updateOne({'scheduledShifts._id': shiftId}, {'$set': {
            'scheduledShifts.$.startDate': startDate,
            'scheduledShifts.$.endDate': endDate,
        }})
        res.json({
            action: 'update',
            section: 'scheduled',
            data: data,
            startTime: startDate ? startDate.format('HH:mm') : '',
            endTime: endDate ? endDate.format('HH:mm') : '',
            hours: (startDate && endDate) ? endDate.diff(startDate, 'hours', true) : 0
        })
    })

    app.post('/api/worked/insert', async function(req, res) {
        const employeeId = req.body.employeeId
        const date = moment.utc(req.body.dateValue)
        const weekOf = getWeekOf(date)

        const startTime = splitTime(req.body.startTime)
        const endTime = splitTime(req.body.endTime)

        const clockedIn = startTime ? date.clone().add(startTime[0], 'hours').add(startTime[1], 'minutes') : null
        const clockedOut = endTime ? date.clone().add(endTime[0], 'hours').add(endTime[1], 'minutes') : null

        if (clockedIn && clockedOut && clockedIn.isAfter(clockedOut)) {
            clockedOut.add(1, 'day')
        }

        const employee = await Employees.findById(employeeId)
        const payRate = await employee.hourlyPay
        employee.workedShifts.push({ date, weekOf, clockedIn, clockedOut, payRate })
        employee.save()

        const shiftId = employee.workedShifts.slice(-1)[0]._id

        res.json({
            action: 'insert',
            section: 'worked',
            employee: employee,
            shiftId,
            startTime: clockedIn ? clockedIn.format('HH:mm') : '',
            endTime: clockedOut ? clockedOut.format('HH:mm') : '',
            payRate,
            hours: (clockedIn && clockedOut) ? clockedOut.diff(clockedIn, 'hours', true) : 0
        })
    })

    app.post('/api/worked/update', async function(req, res) {
        const employeeId = req.body.employeeId
        const shiftId = req.body.shiftId
        const date = moment.utc(req.body.dateValue)

        const startTime = splitTime(req.body.startTime)
        const endTime = splitTime(req.body.endTime)

        const clockedIn = startTime ? date.clone().add(startTime[0], 'hours').add(startTime[1], 'minutes') : null
        const clockedOut = endTime ? date.clone().add(endTime[0], 'hours').add(endTime[1], 'minutes') : null
        
        if (clockedIn && clockedOut && clockedIn.isAfter(clockedOut)) {
            clockedOut.add(1, 'day')
        }

        data = await Employees.updateOne({'workedShifts._id': shiftId}, {'$set': {
            'workedShifts.$.clockedIn': clockedIn,
            'workedShifts.$.clockedOut': clockedOut,
        }})

        res.json({
            action: 'update',
            section: 'worked',
            data: data,
            clockedIn: clockedIn ? clockedIn.format('HH:mm') : '',
            clockedOut: clockedOut ? clockedOut.format('HH:mm') : '',
            hours: (clockedIn && clockedOut) ? clockedOut.diff(clockedIn, 'hours', true) : 0
        })
    })
}