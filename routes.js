const {Employees} = require('./database/connect')
const moment = require('moment');

function getWeekOf(date) {
    return date.clone().add(1, 'day').format('GGGG.WW')
}

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
            const hours = (startDate && endDate) ? endDate.diff(startDate, 'hours', true) : 0
            
            scheduledShifts[date].id = shift._id
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
            id: '',
            date: date.format('YYYY-MM-DD'),
            dateDisplay: date.format('MMM D'),
            dow: date.format('dddd'),
            start: '',
            end: '',
            hours: 0
        }
    }

    for (let shift of employee.workedShifts) {
        if (shift.weekOf == workedWeekOf) {
            const date = moment(shift.date).format('MMM-DD')
            const startDate = shift.clockedIn ? moment(shift.clockedIn) : null
            const endDate = shift.clockedOut ? moment(shift.clockedOut) : null
            const hours = (startDate && endDate) ? endDate.diff(startDate, 'hours', true) : 0
            
            workedShifts[date].id = shift._id
            workedShifts[date].start = startDate ? startDate.format('HH:mm') : ''
            workedShifts[date].end = endDate ? endDate.format('HH:mm') : ''
            workedShifts[date].hours = hours
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

module.exports = function(app) {
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
}